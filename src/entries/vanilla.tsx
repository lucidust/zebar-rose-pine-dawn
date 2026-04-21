import { render } from 'solid-js/web';
import { App } from '../app';
import { createProviders } from '../providers';
import '../styles.css';

const providers = createProviders('vanilla');

render(
  () => <App providers={providers} variant="vanilla" />,
  document.getElementById('root')!,
);
