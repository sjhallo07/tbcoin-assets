import { appConfig } from './config';
import { EventLogger } from './eventLogger';
import { TokenState } from './tokenState';
import {
  ContractInstruction,
  ContractModification,
  EventLog,
  TestCaseResult,
  TokenSnapshot,
} from './types';
import { applyValidationRules, verifySignature } from './utils/validation';

interface UpgradeRequest {
  version: string;
  changes: Record<string, unknown>;
  authority: string;
  signature: string;
  timestamp: number;
}

interface ModificationResult {
  instruction: ContractInstruction;
  field: string;
  value: unknown;
  appliedAt: number;
}

export class ContractManager {
  private readonly modifiableFields = [
    'name',
    'symbol',
    'decimals',
    'supply',
    'taxRate',
    'burnRate',
    'rewardsRate',
  ];

  private readonly tokenState: TokenState;
  private readonly logger: EventLogger;
  private readonly appliedModifications: ModificationResult[] = [];
  private readonly upgrades: UpgradeRequest[] = [];

  constructor(tokenState: TokenState, logger: EventLogger) {
    this.tokenState = tokenState;
    this.logger = logger;
  }

  async handleModification(mod: ContractModification): Promise<{ snapshot: TokenSnapshot; event: EventLog }> {
    this.validateAuthority(mod.authority);
    this.ensureFreshTimestamp(mod.timestamp);
    const payload = {
      instruction: mod.instruction,
      parameters: mod.parameters,
      authority: mod.authority,
      timestamp: mod.timestamp,
    };
    verifySignature(payload, mod.signature, appConfig.apiKey);

    let fieldApplied: string | null = null;
    switch (mod.instruction) {
      case 'UPDATE_METADATA': {
        this.assertModifiable(mod.parameters.field);
        applyValidationRules(mod.parameters.value, mod.parameters.validationRules);
        this.tokenState.setMetadata(mod.parameters.field, mod.parameters.value);
        fieldApplied = mod.parameters.field;
        break;
      }
      case 'CHANGE_SUPPLY': {
        if (typeof mod.parameters.value !== 'string' && typeof mod.parameters.value !== 'number') {
          throw new Error('Supply must be provided as string or number');
        }
        const supply = BigInt(mod.parameters.value);
        this.tokenState.changeSupply(supply);
        fieldApplied = 'supply';
        break;
      }
      case 'MODIFY_TAX': {
        this.assertModifiable(mod.parameters.field);
        this.tokenState.setRates(mod.parameters.field, mod.parameters.value);
        fieldApplied = mod.parameters.field;
        break;
      }
      case 'PAUSE_TRANSFERS': {
        if (typeof mod.parameters.value !== 'boolean') {
          throw new Error('Pause flag must be boolean');
        }
        this.tokenState.pauseTransfers(mod.parameters.value);
        fieldApplied = 'paused';
        break;
      }
      default:
        throw new Error(`Unsupported instruction ${(mod as { instruction: string }).instruction}`);
    }

    const snapshot = this.tokenState.getSnapshot();
    const event = await this.logger.logEvent('CONTRACT_MODIFIED', {
      instruction: mod.instruction,
      parameters: mod.parameters,
      authority: mod.authority,
      snapshot: {
        ...snapshot,
        supply: snapshot.supply.toString(),
      },
    }, 'CONFIRMED');

    if (fieldApplied) {
      this.appliedModifications.push({
        instruction: mod.instruction,
        field: fieldApplied,
        value: mod.parameters.value,
        appliedAt: Date.now(),
      });
    }

    return { snapshot, event };
  }

  async handleUpgrade(request: UpgradeRequest): Promise<EventLog> {
    this.validateAuthority(request.authority);
    this.ensureFreshTimestamp(request.timestamp);
    const payload = {
      version: request.version,
      changes: request.changes,
      authority: request.authority,
      timestamp: request.timestamp,
    };
    verifySignature(payload, request.signature, appConfig.apiKey);
    this.upgrades.push(request);

    return this.logger.logEvent('UPGRADE', {
      version: request.version,
      changes: request.changes,
      authority: request.authority,
    }, 'CONFIRMED');
  }

  getStatus(): {
    token: TokenSnapshot;
    modifications: ModificationResult[];
    upgrades: UpgradeRequest[];
  } {
    return {
      token: this.tokenState.getSnapshot(),
      modifications: [...this.appliedModifications],
      upgrades: [...this.upgrades],
    };
  }

  buildContractTests(): TestCaseResult[] {
    const snapshot = this.tokenState.getSnapshot();

    const ratesWithinRange = (snap: TokenSnapshot) =>
      snap.taxRate >= 0 &&
      snap.taxRate <= 1 &&
      snap.burnRate >= 0 &&
      snap.burnRate <= 1 &&
      snap.rewardsRate >= 0 &&
      snap.rewardsRate <= 1;

    return [
      {
        name: 'Metadata fields are non-empty',
        success: snapshot.name.length > 0 && snapshot.symbol.length > 0,
        error: snapshot.name.length > 0 && snapshot.symbol.length > 0 ? undefined : 'Metadata fields missing',
      },
      {
        name: 'Rates within allowed range',
        success: ratesWithinRange(snapshot),
        error: ratesWithinRange(snapshot)
          ? undefined
          : 'One or more rates out of range',
      },
    ];
  }

  private validateAuthority(authority: string): void {
    if (authority !== appConfig.updateAuthority) {
      throw new Error('Unauthorized authority');
    }
  }

  private ensureFreshTimestamp(timestamp: number): void {
    const now = Date.now();
    const maxDrift = 5 * 60 * 1000;
    if (timestamp > now) {
      throw new Error('Timestamp cannot be in the future');
    }
    const drift = now - timestamp;
    if (drift > maxDrift) {
      throw new Error('Timestamp outside allowed window');
    }
  }

  private assertModifiable(field: string): void {
    if (!this.modifiableFields.includes(field)) {
      throw new Error(`Field ${field} cannot be modified`);
    }
  }
}
