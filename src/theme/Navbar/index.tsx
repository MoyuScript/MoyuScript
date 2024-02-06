import Link from '@docusaurus/Link';
import { useColorMode } from '@docusaurus/theme-common';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { usePluginData } from '@docusaurus/useGlobalData';
import DocSearchBlog from '@site/src/components/DocSearchBlog';
import React from 'react';


export interface NavBarProps {

}

const NavBar: React.FC<NavBarProps> = () => {
    const { colorMode, setColorMode } = useColorMode();
    const { siteConfig } = useDocusaurusContext();
    const data = usePluginData('global-authors') as any;
    const author = data?.MoyuScript;

    return (
        <div className='navbar' style={{
            height: '400px',
            background: `url(${author?.banner_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            padding: '0',
            width: '100%',
            display: 'block'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                height: '100%',
                background: colorMode === 'light' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.8)',
            }}>
                <nav style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    width: '100%',
                    padding: '1rem',
                    color: 'var(--ifm-color-white)',
                    display: 'flex',
                    justifyContent: 'space-between',
                }}>
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                    }}>
                        <Link
                            to="/"
                            style={{
                                color: 'var(--ifm-color-white)',
                                textDecoration: 'none',
                                fontWeight: 'bold',
                                marginRight: '1rem',
                            }}>
                            主页
                        </Link>
                        <Link
                            to="/archive"
                            style={{
                                color: 'var(--ifm-color-white)',
                                textDecoration: 'none',
                                fontWeight: 'bold',
                                marginRight: '1rem',
                            }}>
                            归档
                        </Link>
                        <Link
                            to="/tags"
                            style={{
                                color: 'var(--ifm-color-white)',
                                textDecoration: 'none',
                                fontWeight: 'bold',
                                marginRight: '1rem',
                            }}>
                            标签
                        </Link>
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                    }}>
                        <div style={{
                            marginRight: '1rem',
                        }}>
                            <DocSearchBlog />
                        </div>
                        <button
                            title={colorMode === 'light' ? '切换为暗色模式' : '切换为亮色模式'}
                            style={{
                                background: 'none',
                                color: 'var(--ifm-color-white)',
                                border: 'none',
                                cursor: 'pointer',
                                lineHeight: 0,
                            }}
                            onClick={() => {
                                setColorMode(colorMode === 'dark' ? 'light' : 'dark');
                            }}>
                            {
                                colorMode === 'light'
                                    ? (
                                        <svg viewBox="0 0 24 24" width="24" height="24" className="lightToggleIcon_dnYY"><path fill="currentColor" d="M12,9c1.65,0,3,1.35,3,3s-1.35,3-3,3s-3-1.35-3-3S10.35,9,12,9 M12,7c-2.76,0-5,2.24-5,5s2.24,5,5,5s5-2.24,5-5 S14.76,7,12,7L12,7z M2,13l2,0c0.55,0,1-0.45,1-1s-0.45-1-1-1l-2,0c-0.55,0-1,0.45-1,1S1.45,13,2,13z M20,13l2,0c0.55,0,1-0.45,1-1 s-0.45-1-1-1l-2,0c-0.55,0-1,0.45-1,1S19.45,13,20,13z M11,2v2c0,0.55,0.45,1,1,1s1-0.45,1-1V2c0-0.55-0.45-1-1-1S11,1.45,11,2z M11,20v2c0,0.55,0.45,1,1,1s1-0.45,1-1v-2c0-0.55-0.45-1-1-1C11.45,19,11,19.45,11,20z M5.99,4.58c-0.39-0.39-1.03-0.39-1.41,0 c-0.39,0.39-0.39,1.03,0,1.41l1.06,1.06c0.39,0.39,1.03,0.39,1.41,0s0.39-1.03,0-1.41L5.99,4.58z M18.36,16.95 c-0.39-0.39-1.03-0.39-1.41,0c-0.39,0.39-0.39,1.03,0,1.41l1.06,1.06c0.39,0.39,1.03,0.39,1.41,0c0.39-0.39,0.39-1.03,0-1.41 L18.36,16.95z M19.42,5.99c0.39-0.39,0.39-1.03,0-1.41c-0.39-0.39-1.03-0.39-1.41,0l-1.06,1.06c-0.39,0.39-0.39,1.03,0,1.41 s1.03,0.39,1.41,0L19.42,5.99z M7.05,18.36c0.39-0.39,0.39-1.03,0-1.41c-0.39-0.39-1.03-0.39-1.41,0l-1.06,1.06 c-0.39,0.39-0.39,1.03,0,1.41s1.03,0.39,1.41,0L7.05,18.36z"></path></svg>
                                    )
                                    : (
                                        <svg viewBox="0 0 24 24" width="24" height="24" className="darkToggleIcon_OBbf"><path fill="currentColor" d="M9.37,5.51C9.19,6.15,9.1,6.82,9.1,7.5c0,4.08,3.32,7.4,7.4,7.4c0.68,0,1.35-0.09,1.99-0.27C17.45,17.19,14.93,19,12,19 c-3.86,0-7-3.14-7-7C5,9.07,6.81,6.55,9.37,5.51z M12,3c-4.97,0-9,4.03-9,9s4.03,9,9,9s9-4.03,9-9c0-0.46-0.04-0.92-0.1-1.36 c-0.98,1.37-2.58,2.26-4.4,2.26c-2.98,0-5.4-2.42-5.4-5.4c0-1.81,0.89-3.42,2.26-4.4C12.92,3.04,12.46,3,12,3L12,3z"></path></svg>
                                    )
                            }
                        </button>
                    </div>
                </nav>
                <p style={{
                    marginBottom: '0',
                }}>
                    <img
                        width={100}
                        height={100}
                        style={{
                            borderRadius: '50%',
                        }}
                        src={author?.image_url} alt="avatar" />
                </p>
                <p style={{
                    color: 'var(--ifm-color-white)',
                    fontWeight: 'bold',
                    marginBottom: '0.5rem',
                    fontSize: '1.5rem',
                }}>
                    {author?.name}
                </p>
                <p style={{
                    color: 'var(--ifm-color-white)',
                    marginBottom: '0.5rem',
                    opacity: 0.7,
                    fontStyle: 'italic',
                }}>
                    ”{author?.title}”
                </p>
                <p style={{
                    color: 'var(--ifm-color-white)',
                    marginBottom: '0',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    margin: '0 1rem'
                }}>
                    {
                        author?.social_links?.map(({ name, url, icon }, index) => (
                            <a
                                key={name}
                                href={url}
                                target='_blank'
                                rel='noopener noreferrer'
                                style={{
                                    color: 'var(--ifm-color-white)',
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginRight: index === author?.social_links?.length - 1 ? '0' : '1rem',
                                    marginBottom: '0.5rem',
                                }}>
                                <img
                                    width={20}
                                    height={20}
                                    src={icon} alt={name} />
                                <span style={{
                                    marginLeft: '0.5rem',
                                }}>
                                    {name}
                                </span>
                            </a>
                        ))
                    }
                </p>
            </div>
        </div>
    );
};

export default NavBar;

