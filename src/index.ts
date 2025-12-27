import { createApplicationContext } from './application';
import { appConfig } from './config';
import { buildServer } from './server';

const context = createApplicationContext();
const app = buildServer(context);

app.listen(appConfig.port, () => {
  console.log(`TB Coin API listening on port ${appConfig.port}`);
});
