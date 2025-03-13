import { useState } from "react";

function AccountProfile() {
  const [user, setUser] = useState({
    name: "John Doe",
    email: "johndoe@example.com",
    phone: "+1 (123) 456-7890",
    bio: "Tech enthusiast and React developer.",
  });

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Account Profile</h2>
      <div className="mb-2">
        <strong>Name:</strong> {user.name}
      </div>
      <div className="mb-2">
        <strong>Email:</strong> {user.email}
      </div>
      <div className="mb-2">
        <strong>Phone:</strong> {user.phone}
      </div>
      <div className="mb-2">
        <strong>Bio:</strong> {user.bio}
      </div>
    </div>
  );
}

export default AccountProfile;
