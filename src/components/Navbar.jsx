import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
    return (
        <nav style={styles.nav}>
            <div style={styles.container}>
                <Link to="/" style={styles.logo}>
                    DIARIO EL DIA <span style={{ fontWeight: 300, fontSize: '0.8em' }}>| Digital</span>
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
        background: '#0047BA',
        padding: '1rem',
        color: 'white',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2000,
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
    },
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    logo: {
        color: 'white',
        textDecoration: 'none',
        fontWeight: 'bold',
        fontSize: '1.2rem',
        letterSpacing: '1px'
    },
    links: {
        display: 'flex',
        gap: '1rem'
    },
    link: {
        color: 'white',
        textDecoration: 'none',
        fontSize: '0.9rem',
        opacity: 0.9
    }
};

export default Navbar;
