import React from "react";
import ReactDOM from "react-dom/client";
import CRMSeguros from "./crm-seguros-v14";
import AdminPanel from "./AdminPanel";

const esAdmin = window.location.pathname === "/admin";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <React.StrictMode>
{esAdmin ? <AdminPanel /> : <CRMSeguros />}
  </React.StrictMode>
);
