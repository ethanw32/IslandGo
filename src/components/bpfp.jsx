import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Bpfp() {
  const location = useLocation();
  const { image, name } = location.state || {};

  return (
    <div className=" h-fit w-full relative pb-10">
      {/* Header Section */}
      <div className='flex py-6 items-center'>
        <img className='h-16 ml-5 rounded-full' src={image} alt="" />
        <h1 className='text-3xl ml-10 max-sm:text-xl'>{name}</h1>

        <div className="flex ml-auto">
        <Link
        to="/addtour"
        className="mr-10 right-10 bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-4xl shadow-lg hover:bg-blue-600 transition-colors"
      >
        +
      </Link>
        <Link
          className='text-4xl ml-auto mr-5 cursor-pointer'
          to="/inbox"
          state={{ name: 'Spice Taxi Tours', imageUrl: 'images/bpfp.jpg', description: 'We are a professional Taxi service. Our services range from airport transfers to island tours.' }}
        >
          <i className="fa fa-commenting"></i>
        </Link>
        </div>
      </div>

      {/* Tour Section */}
      <div className='flex my-5'>
        <img className='my-10 mx-5 max-sm:h-[100px] w-[300px] h-[250px] max-sm:mt-16 rounded-md' src="images/fort.jpg" alt="" />
        <div className='float-right my-5'>
          <h1 className='font-bold text-2xl mb-2.5'>Explore the forts</h1>
          <p className='max-sm:text-sm w-[600px]'>Step back in time and explore the rich history of Grenada's colonial past with a guided tour of its iconic forts. This tour takes you to some of the island's most significant historical landmarks, offering stunning views, fascinating stories, and a glimpse into the strategic importance of these fortifications. This tour combines education, exploration, and breathtaking scenery.</p>
          <h2 className='my-2.5 font-bold text-xl'>Spots</h2>
          <li>Fort George - Begin your journey at Fort George</li>
          <li>Fort Frederick - Next, visit Fort Frederick</li>
          <li>Fort Matthew - End on top of Fort Matthew</li>
        </div>
        <div className='ml-auto mr-10 justify-center w-[400px]'>
          <h1 className='text-center text-2xl font-bold mb-5'>Route</h1>
          <iframe className="justify-center" src="https://www.google.com/maps/embed?pb=!1m34!1m12!1m3!1d8819.838582981765!2d-61.751328456380065!3d12.052872002737463!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m19!3e0!4m5!1s0x8c3821713885960b%3A0xef7f078241160a21!2sFort%20George%2C%20Grand%20Etang%20Road%2C%20Saint%20George&#39;s%2C%20Grenada!3m2!1d12.049378899999999!2d-61.753733399999994!4m5!1s0x8c38213d48caa40b%3A0x216a081708d0fe22!2sFort%20Matthew%2C%20Saint%20George&#39;s%2C%20Grenada!3m2!1d12.0502793!2d-61.7380704!4m5!1s0x8c38219a5d0d48c5%3A0xd43849abec66c009!2sFort%20Frederick%2C%20Richmond%20Hill%2C%20Grenada!3m2!1d12.048192799999999!2d-61.7375121!5e1!3m2!1sen!2s!4v1741739135900!5m2!1sen!2s" width="100%" height="250"></iframe>
        </div>
      </div>

      {/* Another Tour Section */}
      <div className='flex my-5'>
        <img className='my-10 mx-5 max-sm:h-[100px] w-[300px] h-[250px] max-sm:mt-16 rounded-md' src="images/naturalsite.jpg" alt="" />
        <div className='float-right my-5'>
          <h1 className='font-bold text-2xl mb-2.5'>Discover the Enchanted Forests of Grenada</h1>
          <p className='max-sm:text-sm w-[600px]'>Immerse yourself in the natural beauty of Grenada's pristine rainforests on this guided eco-tour. This adventure takes you deep into the heart of the island's lush greenery, where you'll discover vibrant flora, exotic wildlife, and hidden waterfalls. Perfect for nature lovers and adventure seekers, this tour offers a mix of hiking, sightseeing, and cultural insights.</p>
          <h2 className='my-2.5 font-bold text-xl'>Spots</h2>
          <li>Annandale Waterfall - Begin your journey at Annandale Waterfall</li>
          <li>Grand Etang National park- Next, visit Grand Etang Nation park</li>
          <li>Seven Sisters Waterfalls - Continue your adventure with a visit to the Seven Sisters Waterfalls</li>
          <li>Goldern falls - Cant end the journey without visiting the beautiful Goldern falls</li>
        </div>
        <div className='ml-auto mr-10 justify-center w-[400px]'>
          <h1 className='text-center text-2xl font-bold mb-5'>Route</h1>
          <iframe src="https://www.google.com/maps/embed?pb=!1m40!1m12!1m3!1d70543.23724980126!2d-61.71691894757121!3d12.111569611229527!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m25!3e0!4m5!1s0x8c38226ed8b4f8fb%3A0x52071e95925e0951!2sAnnandale%20Waterfall%20%26%20Forest%20Park%2C%20Willis%2C%20Grenada!3m2!1d12.0874375!2d-61.7170625!4m5!1s0x8c3818809654c4df%3A0x2cb59720acc88566!2sGrand%20Etang%20Lake%2C%20Grenada!3m2!1d12.0973369!2d-61.695449999999994!4m5!1s0x8c38198bf344664d%3A0x663da6f68a7671cb!2sSeven%20Sisters%20Waterfalls%2C%20St%20Andrew&#39;s%2C%20Grenada!3m2!1d12.095045299999999!2d-61.6804862!4m5!1s0x8c3817ed93503547%3A0x7c429ec6d7b52328!2sGolden%20Falls%2C%20Mount%20Horne%2C%20Grenada!3m2!1d12.142906799999999!2d-61.6465001!5e1!3m2!1sen!2s!4v1741742835138!5m2!1sen!2s" width="100%" height="250"></iframe>
        </div>
      </div>

    </div>
  );
}