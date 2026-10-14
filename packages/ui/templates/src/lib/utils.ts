import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * Register token utilities with tailwind-merge to avoid silent failures:
 * 1) Unknown names may be mistaken for colors: text-label text-foreground loses the font size, and
 *    ring-focus ring-ring loses ring thickness, removing keyboard focus rings across components.
 * 2) Unrecognized shared groups retain both classes: caller rounded-lg cannot override rounded-control.
 * Update this registration whenever names are added to styles/globals.css @theme or @utility.
 */
const merge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        'display-xl',
        'display-lg',
        'display-md',
        'display-sm',
        'title-lg',
        'title-md',
        'title-sm',
        'body',
        'body-sm',
        'label',
        'caption',
        'micro',
      ],
      radius: ['control', 'card', 'sheet', 'pill'],
      shadow: ['card', 'card-hover', 'message', 'panel', 'raised'],
      ease: ['standard', 'emphasized'],
    },
    classGroups: {
      'ring-w': [{ ring: ['focus', 'field'] }],
      'ring-offset-w': [{ 'ring-offset': ['focus'] }],
      opacity: [{ opacity: ['disabled', 'disabled-content'] }],
      duration: [{ duration: ['instant', 'fast', 'base', 'slow', 'slower'] }],
      z: [{ z: ['raised', 'sticky', 'appbar', 'overlay', 'modal', 'dropdown', 'toast'] }],
      scale: [{ scale: ['press', 'press-thumb'] }],
      'min-w': [{ 'min-w': ['menu'] }],
      w: [{ w: ['picker'] }],
      'max-w': [{ 'max-w': ['picker'] }],
      h: [{ h: ['appbar', 'bottom-nav'] }],
    },
  },
})

/** clsx + tailwind-merge: conditional class composition and conflicting utility resolution, including token utilities. */
export function cn(...inputs: ClassValue[]) {
  return merge(clsx(inputs))
}
