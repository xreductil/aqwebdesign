function UserCard({ user, onLogout }) {
  return (
    <div className="user-card">
      <img
        src={user.avatar_url}
        alt={user.display_name}
      />

      <h3>{user.display_name}</h3>

      <button type="button" onClick={onLogout}>
        登出
      </button>
    </div>
  );
}

export default UserCard;
