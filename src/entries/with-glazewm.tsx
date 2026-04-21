import { render } from 'solid-js/web';
import { App } from '../app';
import { createProviders } from '../providers';
import '../styles.css';

const providers = createProviders('with-glazewm');

render(
  () => <App providers={providers} variant="with-glazewm" />,
  document.getElementById('root')!,
);
