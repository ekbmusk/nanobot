import { useMemo, useState } from 'react'

export default function Avatar({ user, size = 'md', className = '', priority = false }) {
    const [broken, setBroken] = useState(false)

    const sizes = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-9 h-9 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-20 h-20 text-3xl',
    }

    const photo = user?.photo_url || user?.photo || null
    const fallbackLetter = useMemo(() => {
        const source = user?.first_name || user?.username || user?.full_name || ''
        return source?.[0]?.toUpperCase() || '?'
    }, [user?.first_name, user?.username, user?.full_name])

    const sizeClass = sizes[size] || sizes.md

    if (photo && !broken) {
        return (
            <img
                src={photo}
                alt={user?.first_name || 'Profile'}
                loading={priority ? 'eager' : 'lazy'}
                decoding="async"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                onError={() => setBroken(true)}
                className={`${sizeClass} rounded-full object-cover border border-border-strong ${className}`}
            />
        )
    }

    return (
        <div className={`${sizeClass} rounded-full bg-gradient-primary flex items-center justify-center font-bold text-white shadow-glow-primary ${className}`}>
            {fallbackLetter}
        </div>
    )
}
