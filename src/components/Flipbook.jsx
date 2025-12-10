import React, { useState, useCallback, useRef, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { Document, Page, pdfjs } from 'react-pdf';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './Flipbook.css';

// Configurar worker de PDF.js
// Configurar worker de PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PdfPage = React.forwardRef(({ pageNumber, width }, ref) => {
    return (
        <div className="page" ref={ref}>
            <div className="page-content">
                <Page
                    pageNumber={pageNumber}
                    width={width}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                    loading={<div className="page-loading">...</div>}
                />
                <div className="page-footer">{pageNumber}</div>
            </div>
        </div>
    );
});

const Flipbook = ({ pdfUrl }) => {
    const [numPages, setNumPages] = useState(null);
    const [currentPage, setCurrentPage] = useState(1); // 1-based index for display
    const [containerWidth, setContainerWidth] = useState(800);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    const [isZoomed, setIsZoomed] = useState(false);

    const bookRef = useRef();
    const transformRef = useRef();

    // ... existing refs ...

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
    };

    // ... existing useEffects ... 


    const onFlip = useCallback((e) => {
        // e.data is the new page index (0-based)
        setCurrentPage(e.data + 1);
    }, []);

    // Ajuste responsivo mejorado (Ancho y Alto)
    useEffect(() => {
        const handleResize = () => {
            const container = document.getElementById('flipbook-container');
            if (container) {
                const availableWidth = container.clientWidth;
                // Aumentamos margen drásticamente para asegurar que NO tape herramientas (Header + Controls + Safety)
                const availableHeight = window.innerHeight - 190;

                const mobile = availableWidth < 768;
                setIsMobile(mobile);

                const aspectRatio = 1.42;

                // 1. Calcular ancho basado en el espacio horizontal
                let potentialPageWidth = mobile ? (availableWidth - 10) : ((availableWidth / 2) - 30);

                // 2. Verificar restricciones verticales
                if (potentialPageWidth * aspectRatio > availableHeight) {
                    potentialPageWidth = availableHeight / aspectRatio;
                }

                const maxPageWidth = 1000;
                potentialPageWidth = Math.min(potentialPageWidth, maxPageWidth);

                setContainerWidth(window.innerWidth > 1000 ? 1000 : window.innerWidth); // Sin margen
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Force top alignment on mobile whenever pages load or resize
    useEffect(() => {
        if (isMobile && transformRef.current) {
            // Small timeout to ensure library has finished its own layout
            setTimeout(() => {
                if (transformRef.current) {
                    transformRef.current.setTransform(0, 10, 1);
                }
            }, 100);
        }
    }, [isMobile, numPages]);

    const toggleFullScreen = () => {
        const elem = document.getElementById('flipbook-container'); // Fullscreen solo el contenedor

        if (!document.fullscreenElement) {
            if (elem.requestFullscreen) {
                elem.requestFullscreen().catch(err => {
                    console.error("Error al intentar entrar en pantalla completa:", err);
                });
            } else if (elem.webkitRequestFullscreen) { /* Safari */
                elem.webkitRequestFullscreen();
            } else if (elem.msRequestFullscreen) { /* IE11 */
                elem.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Diario El Día',
                    text: `Lee la edición digital de Diario El Día. Estoy en la página ${currentPage}.`,
                    url: window.location.href,
                });
            } catch (error) {
                console.log('Error compartiendo:', error);
            }
        } else {
            // Fallback
            navigator.clipboard.writeText(window.location.href);
            alert('¡Enlace copiado al portapapeles!');
        }
    };

    const handleDownloadPage = () => {
        // Simple hack: Encontrar el canvas visible en el viewport
        // Nota: react-pdf renderiza en canvas. react-pageflip mueve estos canvas.
        const currentCanvas = document.querySelector(`.react-pdf__Page[data-page-number="${currentPage}"] canvas`);

        if (currentCanvas) {
            const link = document.createElement('a');
            link.download = `diario-eldia-pag-${currentPage}.png`;
            link.href = currentCanvas.toDataURL();
            link.click();
        } else {
            // Fallback: Try to find ANY visible canvas if the specific one fails (rare)
            const visibleCanvas = document.querySelector('.react-pdf__Page__canvas');
            if (visibleCanvas) {
                const link = document.createElement('a');
                link.download = `diario-eldia-pag-${currentPage}.png`;
                link.href = visibleCanvas.toDataURL();
                link.click();
            } else {
                alert("Espera a que la página cargue completamente para descargarla.");
            }
        }
    };

    return (
        <div id="flipbook-container" className="flipbook-wrapper">
            <TransformWrapper
                ref={transformRef}
                initialScale={1}
                minScale={1}
                maxScale={5}
                centerOnInit={!isMobile}
                initialPositionX={0}
                wheel={{ step: 0.1 }}
                alignmentAnimation={{ disabled: true }}
                onTransformed={(ref, state) => {
                    // Update zoom text
                    const zoomText = document.getElementById('zoom-level-text');
                    if (zoomText) {
                        zoomText.textContent = `${Math.round(state.scale * 100)}%`;
                    }
                    // Disable flip on zoom (threshold lowered to 1.001 to catch any zoom)
                    setIsZoomed(state.scale > 1.001);
                }}
            >
                {({ zoomIn, zoomOut, resetTransform, instance }) => (
                    <>
                        <TransformComponent
                            wrapperClass="zoom-wrapper"
                            contentClass={`zoom-content ${isZoomed ? 'is-zoomed' : ''}`}
                        >
                            <Document
                                file={pdfUrl}
                                onLoadSuccess={onDocumentLoadSuccess}
                                loading={<div className="loading-spinner">Cargando diario...</div>}
                                className="pdf-document"
                            >
                                <HTMLFlipBook
                                    key={isMobile ? 'mobile' : 'desktop'}
                                    width={containerWidth}
                                    height={containerWidth * 1.4}
                                    size="fixed"
                                    minWidth={200}
                                    maxWidth={1000}
                                    minHeight={300}
                                    maxHeight={1633}
                                    maxShadowOpacity={0.5}
                                    showCover={true}
                                    mobileScrollSupport={true}
                                    usePortrait={isMobile}
                                    // Disable interactions when zoomed
                                    useMouseEvents={!isZoomed}
                                    clickEventForward={!isZoomed}
                                    showPageCorners={!isZoomed}
                                    disableFlipByClick={isZoomed}
                                    onFlip={onFlip}
                                    ref={bookRef}
                                    className="flipbook-instance"
                                    flippingTime={800}
                                >
                                    {Array.from(new Array(numPages || 0), (el, index) => (
                                        <PdfPage key={`page_${index + 1}`} pageNumber={index + 1} width={containerWidth} />
                                    ))}
                                </HTMLFlipBook>
                            </Document>
                        </TransformComponent>

                        {/* Controls Overlay */}
                        {numPages && (
                            <div className="controls">
                                {/* Navigation */}
                                <button onClick={() => bookRef.current?.pageFlip()?.flipPrev()} title="Anterior">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                </button>

                                <span className="page-info">
                                    {currentPage} / {numPages}
                                </span>

                                <button onClick={() => bookRef.current?.pageFlip()?.flipNext()} title="Siguiente">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                </button>

                                <div className="separator"></div>

                                {/* Zoom Tools */}
                                <button onClick={() => zoomOut()} title="Alejar">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                </button>
                                <button
                                    onClick={() => { resetTransform(); }}
                                    title="Restaurar Zoom"
                                    style={{ fontSize: '0.8rem', width: '50px', padding: '0', borderRadius: '20px' }}
                                >
                                    <span id="zoom-level-text">100%</span>
                                </button>
                                <button onClick={() => zoomIn()} title="Acercar">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                </button>

                                <div className="separator"></div>

                                {/* Extra Actions */}
                                <a href={pdfUrl} download="diario-eldia.pdf" title="Descargar PDF" style={{ display: 'flex', alignItems: 'center', color: 'inherit' }}>
                                    <button as="div" title="Descargar PDF Completo">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                    </button>
                                </a>
                                <button onClick={handleDownloadPage} title="Descargar Página Actual (Imagen)">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                </button>
                                <button onClick={handleShare} title="Compartir">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                                </button>

                                <div className="separator"></div>

                                <button onClick={toggleFullScreen} title="Pantalla completa">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </TransformWrapper>
        </div>
    );
};

export default Flipbook;
