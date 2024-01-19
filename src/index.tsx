import 'core-js/stable';
import 'whatwg-fetch';

import React from 'react';
import ReactDOM from 'react-dom/client';
const App = React.lazy(() => import('./App'));

const root = ReactDOM.createRoot(
  document.getElementById('transactory-root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
