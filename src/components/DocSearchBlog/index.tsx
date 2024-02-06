import React from 'react'
import { DocSearch } from '@docsearch/react';

import '@docsearch/css';

export default function DocSearchBlog() {
  return (
    <DocSearch 
        appId='N1DONY656G'
        apiKey='8f2dfc94f786a10e5442aee72980d756'
        indexName='blog-search'
    />
  )
}
