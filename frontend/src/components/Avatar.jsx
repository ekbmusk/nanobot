export default function Avatar({ user, size = 'md' }) {
  const sizes = { sm: 'w-10 h-10 text-base', md: 'w-16 h-16 text-2xl', lg: 'w-20 h-20 text-3xl' };
  const initial = (user?.first_name || 'O')[0].toUpperCase();

  return (
    <div className={`${sizes[size]} rounded-full flex items-center justify-center font-extrabold text-bg shrink-0 overflow-hidden`}
      style={{ background: 'linear-gradient(135deg, var(--color-teal), var(--color-gold))', boxShadow: '0 0 30px rgba(56,217,169,0.2)' }}>
      {user?.photo_url
        ? <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
        : initial
      }
    </div>
  );
}
