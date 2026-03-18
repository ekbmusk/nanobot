import SkeletonPage from './SkeletonLoader'
export default function LoadingSpinner({ cards = 3 }) {
  return <SkeletonPage cards={cards} />
}
