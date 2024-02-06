// Import the original mapper
import MDXComponents from '@theme-original/MDXComponents';
import BilibiliVideo from '../components/BilibiliVideo';
import GitHubRepo from '../components/GitHubRepo';

export default {
    // Re-use the default mapping
    ...MDXComponents,
    BilibiliVideo,
    GitHubRepo,
};
