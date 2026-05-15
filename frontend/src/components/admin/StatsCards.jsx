export default function StatsCards({ stats }) {
  return (
    <div className="stats-grid">
      {stats.map((stat, i) => (
        <div
          key={stat.id}
          className={`stat-card animate-in animate-delay-${i + 1}`}
          style={{ background: stat.gradient }}
        >
          <div className="stat-label">{stat.label}</div>
          <div className="stat-value">{stat.value}</div>
          <div className="stat-change">{stat.change}</div>
        </div>
      ))}
    </div>
  );
}
