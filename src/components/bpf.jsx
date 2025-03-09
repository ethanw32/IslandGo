import React from 'react'
import { Link } from 'react-router-dom'

export default function bpf() {
  return (
    <div>
    <div className="bg-black text-white text-3xl text-center h-16 flex items-center justify-center">
      Business Profile
    </div>

    <div className="h-fit w-full relative pb-10">

    <div className='flex py-6 items-center'>
      <img className='h-16 ml-5 rounded-full' src="images/bpfp.jpg" alt="" />
      <h1 className='text-3xl ml-10 max-sm:text-xl'>Spice Taxi Tours</h1>
            <Link
              className='text-4xl ml-auto mr-5 cursor-pointer'
                to="/inbox"
                state={{ name: 'Spice Taxi Tours', imageUrl: 'images/bpfp.jpg', description: 'We are a professional Taxi service. Our services range from airport transfers to island tours.' }}
              ><i className="fa fa-commenting "></i></Link>
    </div>

    <div className='p-3 text-white text-center m-auto bg-black w-[110px] rounded-xl'>
      <h1 className='font-medium text-3xl max-sm:text-xl m-0'>Tours</h1>
    </div>

    <div className='flex my-5'>
    <img className='my-10 mx-5 max-sm:h-[100px] max-sm:mt-16' src="images/nutmeg tour.png" alt="" />
    <div className='float-right mt-10'><h1 className='font-bold text-xl'>Nutmeg Tour</h1> <p className='max-sm:text-sm'>Our taxi tour service offers guided island tours, showcasing scenic spots, historical landmarks, and local attraction, providing  a personalized,  comfortable and informative tours.</p></div>
    </div>

    <div className='flex my-5'>
    <img className='my-10 mx-5 max-sm:h-[100px] max-sm:mt-16' src="images/nutmeg tour.png" alt="" />
    <div className='float-right mt-10'><h1 className='font-bold text-xl'>Nutmeg Tour</h1> <p className='max-sm:text-sm'>Our taxi tour service offers guided island tours, showcasing scenic spots, historical landmarks, and local attraction, providing  a personalized,  comfortable and informative tours.</p></div>
    </div>

    <div className='flex  mt-5'>
    <img className='my-10 mx-5 max-sm:h-[100px] max-sm:mt-16' src="images/nutmeg tour.png" alt="" />
    <div className='float-right mt-10'><h1 className='font-bold text-xl'>Nutmeg Tour</h1> <p className='max-sm:text-sm'>Our taxi tour service offers guided island tours, showcasing scenic spots, historical landmarks, and local attraction, providing  a personalized,  comfortable and informative tours.</p></div>
    </div>


    </div>
  </div>
  
  )
}
