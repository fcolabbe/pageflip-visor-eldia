import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
    return (
        <nav style={styles.nav}>
            <div style={styles.container}>
                <Link to="/" style={styles.branding}>
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
                            opacity: 0.95,
                            whiteSpace: 'nowrap'
                        }}>
                            Papel <span style={{ fontWeight: '300', opacity: 0.8 }}>Digital</span>
                        </span>
                    </div>
                </Link>

                <div style={styles.links}>
                    <Link to="/login" style={styles.link}>Admin</Link>
                </div>
            </div>
        </nav>
    );
};

const styles = {
    nav: {
        backgroundColor: '#0054a6',
        backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 2px, rgba(0, 0, 0, 0.2) 2px, rgba(0, 0, 0, 0.2) 4px)',
        padding: '0.8rem 1rem',
        color: 'white',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2000,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    branding: {
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center'
    },
    links: {
        display: 'flex',
        gap: '1rem'
    },
    link: {
        color: 'white',
        textDecoration: 'none',
        fontSize: '0.9rem',
        opacity: 0.9,
        background: 'rgba(255,255,255,0.1)',
        padding: '5px 12px',
        borderRadius: '4px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        fontSize: '0.8rem'
    }
};

export default Navbar;
