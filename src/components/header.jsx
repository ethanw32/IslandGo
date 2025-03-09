import React from 'react'
import { Link } from 'react-router-dom'

function header() {
  return (
<div className="flex flex-row items-center bg-[#D9D9D9] text-3xl h-24 px-10">
  {/* Left Section */}
  <div className="font-bold text-black max-sm:text-2xl">
    <Link to='/'>IslandGo</Link>
  </div>

  {/* Right Section */}
  <div className="ml-auto text-xl flex space-x-4">
  
    <Link to= '/login'>LogIn/Sign up </Link>
  </div>
</div>
  )
}

export default header