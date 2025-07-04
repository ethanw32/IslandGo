import React from 'react';

function Footer() {
  return (
    <footer className="hidden md:flex flex-row items-center text-3xl text-white bg-[#212121] h-24 w-full px-10 z-10">
      {/* Left Section */}
      <div className="font-bold max-sm:text-2xl">IslandGo</div>

      {/* Right Section */}
      <div className="ml-auto text-base space-x-4">
        <h1 className="text-center text-xl max-sm:text-lg">Contact</h1>

        <span className='hover:underline cursor-pointer max-sm:text-sm'>IslandGo@gmail.com</span>
        <br />
        <span className='hover:underline cursor-pointer'>1(473)123-4567</span>
      </div>
    </footer>
  );
}

export default Footer;
