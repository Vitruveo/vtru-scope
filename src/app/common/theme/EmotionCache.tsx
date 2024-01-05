'use client';

import type {
    EmotionCache,
    Options as OptionsOfCreateCache,
} from '@emotion/cache';
import createCache from '@emotion/cache';
import { CacheProvider as DefaultCacheProvider } from '@emotion/react';
import { useServerInsertedHTML } from 'next/navigation';
import * as React from 'react';

export type NextAppDirEmotionCacheProviderProps = {
    /** This is the options passed to createCache() from 'import createCache from "@emotion/cache"' */
    options: Omit<OptionsOfCreateCache, 'insertionPoint'>;
    /** By default <CacheProvider /> from 'import { CacheProvider } from "@emotion/react"' */
    CacheProvider?: (props: {
        value: EmotionCache;
        children: React.ReactNode;
    }) => React.JSX.Element | null;
    children: React.ReactNode;
};

// This implementation is taken from https://github.com/garronej/tss-react/blob/main/src/next/appDir.tsx
export function NextAppDirEmotionCacheProvider(
    props: NextAppDirEmotionCacheProviderProps
) {
    const { options, CacheProvider = DefaultCacheProvider, children } = props;

    const [emotionCache] = React.useState(() => {
        const cacheConf = createCache(options);
        cacheConf.compat = true;
        const prevInsert = cacheConf.insert;
        let inserted: string[] = [];
        cacheConf.insert = (...args) => {
            const serialized = args[1];
            if (cacheConf.inserted[serialized.name] === undefined) {
                inserted.push(serialized.name);
            }
            return prevInsert(...args);
        };

        return {
            cache: cacheConf,
            flush: () => {
                const prevInserted = inserted;
                inserted = [];
                return prevInserted;
            },
        };
    });

    useServerInsertedHTML(() => {
        const names = emotionCache.flush();
        if (names.length === 0) {
            return null;
        }
        let styles = '';
        // eslint-disable-next-line no-restricted-syntax
        for (const name of names) {
            styles += emotionCache.cache.inserted[name];
        }
        return (
            <style
                key={emotionCache.cache.key}
                data-emotion={`${emotionCache.cache.key} ${names.join(' ')}`}
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                    __html: styles,
                }}
            />
        );
    });

    return <CacheProvider value={emotionCache.cache}>{children}</CacheProvider>;
}
