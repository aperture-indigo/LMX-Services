const express = require('express');
const path = require('node:path');

const app = express();
const port = Number(process.env.PORT) || 3000;

app.disable('x-powered-by');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});

const pages = ['/', '/our-services', '/our-services/home-renovations', '/our-services/landscaping-and-lawn', '/our-services/demolition-junk-removal', '/our-services/flooring', '/our-services/repairs-maintenance', '/our-services/custom-projects', '/our-services/auto-detailing', '/our-services/pest-rodent-control', '/about-us', '/client-testimonials'];
app.get(pages, (_request, response) => response.sendFile(path.join(__dirname, 'public', 'index.html')));

app.use((_request, response) => {
  response.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.listen(port, (error) => {
  if (error) {
    console.error('Unable to start the server:', error);
    process.exitCode = 1;
    return;
  }

  console.log(`LMX Services demo running at http://localhost:${port}`);
});
