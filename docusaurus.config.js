// @ts-check
const yaml = require('yaml');
const fs = require('fs');
const path = require('path');

const baseUrl = '/MoyuScript';
const url = 'https://moyuscript.github.io';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: '摸鱼小站',
  url,
  baseUrl,
  i18n: {
    defaultLocale: 'zh-cn',
    locales: ['zh-cn'],
  },
  favicon: '/favicon.png',
  headTags: [
    {
      tagName: 'link',
      attributes: {
        rel: 'stylesheet',
        href: 'https://cdn.bootcdn.net/ajax/libs/font-awesome/6.4.0/css/all.min.css',
      }
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'referrer',
        content: 'no-referrer',
      }
    }
  ],
  presets: [
    [
      '@docusaurus/preset-classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        blog: {
          routeBasePath: '/',
          showReadingTime: false,
          blogTitle: '摸鱼小站',
          blogDescription: 'MoyuScript 的博客，啥都会发~',
          blogSidebarTitle: '最近的文章',
          blogSidebarCount: 0,
        },
        docs: false,
        pages: false,
        sitemap: {},
        gtag: {
          trackingID: 'G-F42Q0L2M6V',
        },
        theme: {
          customCss: [require.resolve('./src/custom.css')]
        }
      })
    ]
  ],
  themeConfig: {
    prism: {
      additionalLanguages: [
        'csharp'
      ]
    },
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: '摸鱼小站',
    },
    footer: {
      copyright: `
        <p>版权所有 © ${new Date().getFullYear()} 摸鱼小站</p>
        <p>
          <a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">
            <img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-sa/4.0/88x31.png" />
          </a>
        </p>
        <p>
          本站所有内容遵循以下协议：<a rel="license noopener noreferrer" href="http://creativecommons.org/licenses/by-sa/4.0/" target="_blank">Creative Commons Attribution-ShareAlike 4.0 International License</a>.
        </p>
      `,
      links: [
        {
          title: '个人社交媒体',
          items: [
            {
              label: '哔哩哔哩',
              to: 'https://space.bilibili.com/660303135'
            },
            {
              label: 'GitHub',
              to: 'https://github.com/MoyuScript'
            },
            {
              label: '知乎',
              to: 'https://www.zhihu.com/people/MoyuScript'
            },
            {
              label: '网易云音乐',
              to: 'https://music.163.com/#/artist?id=14074362',
            }
          ]
        },
        {
          title: '友情链接',
          items: [
            {
              label: '如题的小屋',
              to: 'https://imrt.top/',
            },
            {
              label: '摸鱼乐谱 MIDI 网',
              to: 'https://moyuscript.github.io/music/'
            }
          ]
        },
        {
          title: '其他',
          items: [
            {
              label: 'QQ群：517319438',
              to: 'http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=_dKtLJ9us0yg84_v6XShTcq_RQ11WpMT&authKey=%2FwZZsZEdnEymWNfrXNt9ov6CJsHNyDzhNLeOcUi9uEOkY2JlDTG79xDOby%2FGP%2Fcc&noverify=0&group_code=517319438'
            },
            {
              label: 'GnuPG 公钥',
              to: 'https://github.com/MoyuScript.gpg',
            }
          ]
        }
      ]
    }
  },
  plugins: [
    (context, options) => {
      const authorPath = path.join(context.siteDir, './blog/authors.yml');
      return {
        name: 'global-authors',
        getPathsToWatch() {
          return [authorPath];
        },
        async loadContent() {
          if (fs.existsSync(authorPath)) {
            const authorContent = await fs.promises.readFile(authorPath, 'utf-8');
            return yaml.parse(authorContent);
          }
        },

        async contentLoaded({content, actions}) {
          if (!content) {
            return;
          }
          actions.setGlobalData(content);
        },
      };
    }
  ]
};

module.exports = config;
