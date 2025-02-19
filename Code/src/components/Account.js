import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styling/Account.css';
import { useUser } from '../context/UserContext';

const Account = () => {
  const [step, setStep] = useState(1); // Step 1: Role Selection | Step 2: Login or Create Account Form
  const [role, setRole] = useState(""); // Role: "customer" or "shopOwner"
  const [isCreatingAccount, setIsCreatingAccount] = useState(false); // Toggle Create Account form
  const [username, setUsername] = useState(""); // Username input
  const [password, setPassword] = useState(""); // Password input
  const [name, setName] = useState(""); // Name input for Create Account
  const [surname, setSurname] = useState(""); // Surname input for Create Account
  const [address, setAddress] = useState(""); // Address input for Create Account
  const { setLoggedInUser } = useUser();
  const navigate = useNavigate();

  // Handle role selection
  const handleRoleSelection = (selectedRole) => {
    setRole(selectedRole);
    setStep(2); // Move to login or create account form
    setIsCreatingAccount(false); // Reset to login form by default
  };

  // Handle login for existing users
  const handleLogin = async () => {
    if (!role || !username || !password) {
      alert("Please fill in all fields.");
      return;
    }

    const query = `
      PREFIX base: <http://www.semanticweb.org/My_Super/>
      SELECT ?user ?password
      WHERE {
        ?user a base:${role === "customer" ? "NormalUser" : "AdminUser"} ;
              base:hasUsername "${username}"^^xsd:string ;
              base:hasPassword "${password}"^^xsd:string .
      }
    `;

    try {
      const response = await axios.get('/repositories/Super_Market', {
        params: { query },
        headers: { Accept: 'application/sparql-results+json' },
      });

      const results = response.data.results.bindings;

      if (results.length > 0) {
        const userInstance = results[0].user.value.split('/').pop(); // Extract NormalUser1, AdminUser1, etc.
        const loggedInUser = { username, userInstance, role };

        localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser)); // Persist user in localStorage
        setLoggedInUser(loggedInUser); // Update global state
        alert(`Welcome, ${role === "customer" ? "Customer" : "Shop Owner"}!`);
        navigate(role === "customer" ? "/account-details" : "/dashboard"); // Redirect based on role
      } else {
        alert("Invalid username or password. Please try again.");
      }
    } catch (error) {
      console.error("Error during login:", error);
      alert("An error occurred while logging in. Please try again later.");
    }
  };

  // Handle account creation (NormalUser only)
  const handleCreateAccount = async () => {
    if (!username || !password || !name || !surname || !address) {
      alert("Please fill in all fields.");
      return;
    }

    const query = `
      PREFIX base: <http://www.semanticweb.org/My_Super/>
      SELECT (COUNT(?user) AS ?userCount)
      WHERE {
        ?user a base:NormalUser .
      }
    `;

    try {
      const countResponse = await axios.get('/repositories/Super_Market', {
        params: { query },
        headers: { Accept: 'application/sparql-results+json' },
      });

      const userCount = parseInt(countResponse.data.results.bindings[0].userCount.value, 10);
      const newUserId = `NormalUser${userCount + 1}`;

      const insertQuery = `
        PREFIX base: <http://www.semanticweb.org/My_Super/>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

        INSERT DATA {
          base:${newUserId} a base:NormalUser ;
                            base:hasUsername "${username}"^^xsd:string ;
                            base:hasPassword "${password}"^^xsd:string ;
                            base:hasName "${name}"^^xsd:string ;
                            base:hasSurname "${surname}"^^xsd:string ;
                            base:hasAddress "${address}"^^xsd:string .
        }
      `;

      const insertResponse = await axios.post('/repositories/Super_Market/statements', `update=${encodeURIComponent(insertQuery)}`, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      if (insertResponse.status === 204) {
        alert("Account created successfully! Please log in.");
        setStep(1); // Return to role selection
      } else {
        alert("Failed to create account. Please try again.");
      }
    } catch (error) {
      console.error("Error during account creation:", error);
      alert("An error occurred while creating your account. Please try again later.");
    }
  };

  return (
    <div className="account-page">
      <h1>Account</h1>

      {step === 1 && (
        <div className="role-selection">
          <button onClick={() => handleRoleSelection("customer")}>Login as Customer</button>
          <button onClick={() => handleRoleSelection("shopOwner")}>Login as Shop Owner</button>
          <button onClick={() => { setIsCreatingAccount(true); setStep(2); }}>Create an Account</button>
        </div>
      )}

      {step === 2 && !isCreatingAccount && (
        <div className="login-form">
          <h2>Login as {role === "customer" ? "Customer" : "Shop Owner"}</h2>
          <div>
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button onClick={handleLogin}>Login</button>
        </div>
      )}

      {step === 2 && isCreatingAccount && (
        <div className="create-account-form">
          <h2>Create Account</h2>
          <div>
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="surname">Surname</label>
            <input
              type="text"
              id="surname"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="address">Address</label>
            <input
              type="text"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button onClick={handleCreateAccount}>Create Account</button>
        </div>
      )}
    </div>
  );
};

export default Account;
