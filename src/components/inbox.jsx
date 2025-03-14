import { useLocation } from 'react-router-dom';

function Inbox() {
  const location = useLocation();
  const { name, image} = location.state || {
  };

  return (
    <div>
      {/* Main Content */}
      <div className="h-screen w-full relative pb-10">
        {/* Business Information */}
        <div className="flex py-6 items-center">
          <img
            className="h-16 max-sm:h-12 ml-5 rounded-full"
            src={image} // Use the `image` from state
            alt={name} // Use the `name` from state as alt text
          />
          <h1 className="text-3xl max-sm:text-2xl ml-10">{name}</h1>
        </div>

        {/* Message Form */}
        <form
          className="flex flex-col"
          action="https://formspree.io/f/xpwzynpr"
          method="POST"
        >
          <h1 className="font-bold text-3xl ml-7 my-5">Send a Message</h1>
          <textarea
            className="h-[200px] w-[400px] max-sm:w-[340px] text-2xl max-sm:text-base text-black pl-3 ml-5"
            placeholder="Enter a message here"
            name="message"
          ></textarea>

          <div className="m-auto mt-5 p-3 text-xl rounded-3xl">
            <button type="submit">Send</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Inbox;