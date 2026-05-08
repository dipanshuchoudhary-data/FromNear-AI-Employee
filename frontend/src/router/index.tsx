import { createBrowserRouter } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import Dashboard from '../pages/Dashboard'
import NewVendor from '../pages/NewVendor'
import VendorsList from '../pages/VendorsList'
import VendorResult from '../pages/VendorResult'
import VendorHistory from '../pages/VendorHistory'
import Settings from '../pages/Settings'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'vendors/new', element: <NewVendor /> },
      { path: 'vendors', element: <VendorsList /> },
      { path: 'vendors/:vendorId', element: <VendorResult /> },
      { path: 'vendors/:vendorId/history', element: <VendorHistory /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
])
