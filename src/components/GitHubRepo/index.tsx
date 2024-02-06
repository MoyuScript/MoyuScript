import React from "react";
import styles from './index.module.css';
import { useRequest } from 'ahooks'

export interface GitHubRepoProps {
    repo: string;
}

const GitHubRepo: React.FC<GitHubRepoProps> = ({ repo }) => {
    const repoInfoRequest = useRequest(async () => {
        const res = await fetch(`https://api.github.com/repos/${repo}`);
        const jsonData = await res.json();
        return jsonData;
    }, {
        refreshDeps: [repo],
        cacheKey: repo,
        staleTime: 1000 * 60,
    });
    const repoInfo = repoInfoRequest.data;

    const stargazersCount = repoInfo?.stargazers_count ?? '-';
    const subscribersCount = repoInfo?.subscribers_count ?? '-';
    const openIssuesCount = repoInfo?.open_issues ?? '-';
    const forksCount = repoInfo?.forks ?? '-';

    const isNotFound = repoInfo?.message === 'Not Found';
    return (
        <p className={styles.githubRepo}>
            <a target="_blank" rel="noopener noreferrer" href={`https://github.com/${repo}`}>
                <span className={styles.left}>
                    <i className="fa-brands fa-github"></i>
                </span>
                <span className={styles.right}>
                    <span
                        className={styles.title}>
                        {isNotFound ? '仓库已失效' : repo}
                    </span>
                    <ul className={styles.iconList}>
                        <li aria-label="Stargazers Count">
                            <i className="fa-solid fa-star"></i>
                            <span>{stargazersCount}</span>
                        </li>
                        <li aria-label="Subscribers count">
                            <i className="fa-solid fa-eye"></i>
                            <span>{subscribersCount}</span>
                        </li>
                        <li aria-label="Open issues count">
                            <i className="fa-solid fa-circle-dot"></i>
                            <span>{openIssuesCount}</span>
                        </li>
                        <li aria-label="Forks Count">
                            <i className="fa-solid fa-code-fork"></i>
                            <span>{forksCount}</span>
                        </li>
                    </ul>
                </span>
            </a>
        </p>
    )
};

export default GitHubRepo;
