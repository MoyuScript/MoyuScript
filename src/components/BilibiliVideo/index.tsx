import React, { useEffect, useState } from 'react';
import styles from './index.module.css';

export interface BilibiliVideoProps {
    bvid: string;
    iframe?: boolean
}

const BilibiliVideo: React.FC<BilibiliVideoProps> = ({ bvid, iframe }) => {
    const [info, setInfo] = useState(null);

    useEffect(() => {
        const callbackName = `callback_${bvid}`
        const url = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}&jsonp=jsonp&callback=${callbackName}`;

        window[callbackName] = (data: any) => {
            setInfo(data);
            delete window[callbackName];
        };

        const script = document.createElement('script');
        script.src = url;
        script.referrerPolicy = 'no-referrer';
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
            delete window[callbackName];
        };
    }, [bvid]);

    if (iframe) {
        return (
            <p style={{
                width: '100%',
                paddingBottom: '56.25%',
                position: 'relative',
            }}>
                <iframe
                    title={info?.data?.title}
                    style={{
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                        top: '0',
                        left: '0',
                    }}
                    src={`https://player.bilibili.com/player.html?bvid=${bvid}`}
                    />
            </p>
        )
    }

    return (
        <a
            href={`https://www.bilibili.com/video/${bvid}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.bilibiliVideo}
            style={{
                marginBottom: 'var(--ifm-leading)',
                background: 'var(--ifm-code-background)',
                borderRadius: 'var(--ifm-global-radius)',
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
                textDecoration: 'none',
            }}>
            <div
                className={
                    styles.coverContainer
                }
                style={{
                    height: '100%',
                    background: 'var(--ifm-color-emphasis-200)',
                    flexShrink: 0,
                }}>
                {info?.data?.pic && (
                    <img
                        style={{
                            height: '100%',
                            width: '100%',
                            objectFit: 'cover',
                        }}
                        src={`${info?.data?.pic}@480w`}
                        alt={info?.data?.title}
                        referrerPolicy='no-referrer' />
                )}
            </div>
            <div style={{
                marginLeft: '1rem',
                overflow: 'hidden',
            }}>
                {
                    info !== null && info?.code === 0 && (
                        <>
                            <p
                                className={
                                    styles.title
                                }
                                style={{
                                    color: 'var(--ifm-color-content)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}>
                                {info?.data?.title}
                            </p>
                            <p
                                className={
                                    styles.author
                                }
                                style={{
                                    marginBottom: '0',
                                    color: 'var(--ifm-color-content-secondary)'
                                }}>
                                UP主：{info?.data?.owner?.name}
                            </p>
                        </>
                    )
                }
                {
                    info !== null && info?.code !== 0 && (
                        <p style={{
                            marginBottom: '10px',
                            color: 'var(--ifm-color-danger)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            视频信息获取失败
                        </p>
                    )
                }
                {
                    info === null && (
                        <p style={{
                            marginBottom: '10px',
                            color: 'var(--ifm-color-content)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            加载中...
                        </p>
                    )
                }
            </div>
        </a>
    );
};

export default BilibiliVideo;

