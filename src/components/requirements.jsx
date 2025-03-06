import React from 'react'
import { Link } from 'react-router-dom'

function requirements() {
  return (
    <div>
    <div className="bg-black text-white text-3xl text-center h-16 flex items-center justify-center">
      Requirements
    </div>

    <div className="h-fit w-full relative pb-10">

    <div className='flex py-6 items-center'>
      <Link to='/rpf'><img className='h-16 ml-5 max-sm:h-12 rounded-full' src="images/rpfp.png" alt="" /></Link>
      <h1 className='text-3xl ml-10 max-sm:text-2xl'>Spice Rentals</h1>
         <Link
                   className='text-4xl max-sm:text-3xl ml-auto mr-5 cursor-pointer'
                    to="/inbox"
                    state={{ name: 'Spice Rentals', imageUrl: 'images/rpfp.png', description: 'We are a professional auto rental business, We also offer a variety of vehicles' }}
                  ><i className="fa fa-commenting "></i></Link>
    </div>

    <div className="rounded-md w-[600px] m-auto p-5 space-y-4 max-sm:text-sm max-sm:w-[360px]">
  <ul className="list-disc list-inside">
      <strong>Minimum Age Requirement:</strong>
      <ul className="list-disc list-inside ml-5">
        <li>Renters must be at least 21 years old to rent a vehicle.</li>
        <li>Renters under 25 may incur an additional “young driver” surcharge.</li>
      </ul>
    
      <strong>Valid Driver's License:</strong>
      <ul className="list-disc list-inside ml-5">
        <li>Renters must present a valid driver’s license that has been held for at least one year.</li>
        <li>An international driver’s permit (IDP) is required for non-local renters.</li>
      </ul>
    
      <strong>Proof of Identity:</strong>
      <ul className="list-disc list-inside ml-5">
        <li>A valid passport or national ID card must be provided at the time of rental.</li>
      </ul>
    
      <strong>Payment Method:</strong>
      <ul className="list-disc list-inside ml-5">
        <li>A valid credit card in the renter’s name is required for the security deposit.</li>
        <li>
          Debit cards and cash payments may not be accepted for deposits but can be used for rental charges.
        </li>
      </ul>
    
      <strong>Insurance Requirements:</strong>
      <ul className="list-disc list-inside ml-5">
        <li>Basic insurance coverage is included in the rental price.</li>
        <li>
          Renters may opt for additional coverage for personal accident insurance or to lower the deductible on the
          basic coverage.
        </li>
      </ul>
   
      <strong>Rental Duration:</strong>
      <ul className="list-disc list-inside ml-5">
        <li>The minimum rental period is 24 hours.</li>
        <li>Late returns beyond the grace period of 1 hour may incur additional daily charges.</li>
      </ul>
    
  </ul>
</div>


    </div>
  </div>
  )
}

export default requirements