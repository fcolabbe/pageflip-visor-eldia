
import React from 'react';

const Header = () => {
    return (
        <header style={{
            backgroundColor: '#0054a6',
            backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 2px, rgba(0, 0, 0, 0.2) 2px, rgba(0, 0, 0, 0.2) 4px)',
            color: 'white',
            padding: '0.8rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            position: 'relative',
            zIndex: 10
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <img
                    src="/logo-header.webp"
                    alt="Diario El Día"
                    style={{
                        height: '38px',
                        width: 'auto',
                        display: 'block',
                        filter: 'brightness(0) invert(1)'
                    }}
                />

                {/* Vertical Separator */}
                <div style={{
                    height: '28px',
                    width: '1px',
                    backgroundColor: 'rgba(255, 255, 255, 0.6)'
                }}></div>

                {/* Text */}
                <span style={{
                    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                    fontWeight: '400',
                    fontSize: '1.4rem',
                    letterSpacing: '1px',
                    color: 'white',
                    textTransform: 'uppercase',
                    opacity: 0.95
                }}>
                    Papel <span style={{ fontWeight: '300', opacity: 0.8 }}>Digital</span>
                </span>
            </div>
        </header>
    );
};

export default Header;
