
import React from 'react';
import Header from './components/Header';
import Flipbook from './components/Flipbook';

// PDF de prueba en /public
const samplePdf = '/sample.pdf';

function App() {
  return (
    <div className="App">
      <Header />
      <main>
        <Flipbook pdfUrl={samplePdf} />
      </main>
    </div>
  );
}

export default App;
