import React from 'react'
import { Link } from 'react-router-dom'

function contact() {
  return (
<div>
    <div className="bg-black text-white text-3xl text-center h-16 flex items-center justify-center">
      Contact Info
    </div>

    <div className="h-10 w-full min-h-screen pb-10">

    <div className='flex py-6 items-center'>
      <Link to='/rpf'><img className='h-16 max-sm:h-12 ml-5 rounded-full' src="images/rpfp.png" alt="" /></Link>
      <h1 className='text-3xl max-sm:text-2xl ml-10'>Spice Rentals</h1>
       <Link
          className='text-4xl max-sm:text-3xl ml-auto mr-5 cursor-pointer'
           to="/inbox"
           state={{ name: 'Spice Rentals', imageUrl: 'images/rpfp.png', description: 'We are a professional auto rental business, We also offer a variety of vehicles' }}
         ><i className="fa fa-commenting "></i></Link>
    </div>

    <div>
    <div className="overflow-x-auto">
  <table className="table-auto border-collapse border border-gray-300 w-[600px] max-sm:text-sm max-sm:w-[360px] m-auto text-left bg-white">
    <thead>
      <tr className="bg-gray-100">
        <th className="border border-gray-300 px-4 py-2">Field</th>
        <th className="border border-gray-300 px-4 py-2">Details</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td className="border border-gray-300 px-4 py-2 font-medium">Business Name:</td>
        <td className="border border-gray-300 px-4 py-2">Spice Rentals</td>
      </tr>
      <tr>
        <td className="border border-gray-300 px-4 py-2 font-medium">Address:</td>
        <td className="border border-gray-300 px-4 py-2">123 Beachfront Avenue, St. George's, Grenada</td>
      </tr>
      <tr>
        <td className="border border-gray-300 px-4 py-2 font-medium">Phone Number:</td>
        <td className="border border-gray-300 px-4 py-2">+1 (473) 555-1234</td>
      </tr>
      <tr>
        <td className="border border-gray-300 px-4 py-2 font-medium">Email:</td>
        <td className="border border-gray-300 px-4 py-2">contact@spicerentals.com</td>
      </tr>
      <tr>
        <td className="border border-gray-300 px-4 py-2 font-medium">Operating Hours:</td>
        <td className="border border-gray-300 px-4 py-2">Monday - Saturday, 8:00 AM - 6:00 PM</td>
      </tr>
    </tbody>
  </table>
</div>

    </div>
    </div>
  </div>
  )
}

export default contact