import { render } from 'solid-js/web';
import { App } from '../app';
import { createProviders } from '../providers';
import '../styles.css';

const providers = createProviders('with-komorebi');

render(
  () => <App providers={providers} variant="with-komorebi" />,
  document.getElementById('root')!,
);
