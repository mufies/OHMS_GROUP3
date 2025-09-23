import {useState} from "react";
import '../customScrollBar.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faSearch, faVideo, faPhone, faEllipsisV} from '@fortawesome/free-solid-svg-icons';
export default function doctorChatPage() {
    const userList = [
        { id: 1, name: 'John Doe', lastMessage: 'Hello, how are you?', time: '2:30 PM' },
        { id: 2, name: 'Jane Smith', lastMessage: 'Can we reschedule?', time: '1:15 PM' },
        { id: 3, name: 'Mike Johnson', lastMessage: 'Thank you!', time: 'Yesterday' },
        { id: 4, name: 'Emily Davis', lastMessage: 'See you soon.', time: 'Monday' },
        { id: 5, name: 'Chris Brown', lastMessage: 'Got it, thanks!', time: 'Sunday' },
        { id: 6, name: 'Sarah Wilson', lastMessage: 'Looking forward to our meeting.', time: 'Saturday' },
        { id: 7, name: 'David Lee', lastMessage: 'Please send the report.', time: 'Friday' },
        { id: 8, name: 'Laura Martinez', lastMessage: 'Happy Birthday!', time: 'Thursday' },
        { id: 9, name: 'James Taylor', lastMessage: 'Let me know your thoughts.', time: 'Wednesday' },
        { id: 10, name: 'Linda Anderson', lastMessage: 'Good luck with your presentation!', time: 'Tuesday' },
        { id: 11, name: 'Kevin White', lastMessage: 'Can you call me back?', time: '1:00 PM' },
        { id: 12, name: 'Jessica Harris', lastMessage: 'I will be there in 10 minutes.', time: '12:45 PM' },
        { id: 13, name: 'Brian Clark', lastMessage: 'Thanks for the update.', time: '11:30 AM' },
    ];

    const messages = [
        { id: 1, sender: 'doctor', text: 'Hello, how can I help you today?', time: '2:30 PM' },
        { id: 2, sender: 'patient', text: 'I have a headache and fever.', time: '2:32 PM' },
        { id: 3, sender: 'doctor', text: 'How long have you been feeling this way?', time: '2:33 PM' },
        { id: 4, sender: 'patient', text: 'For about two days now.', time: '2:34 PM' },
        { id: 5, sender: 'doctor', text: 'I recommend you take some rest and stay hydrated.', time: '2:35 PM' },
    ];
     const [selectedUser, setSelectedUser] = useState(userList[0]);
     const showUserList = () =>
         (
                <div className="w-full border-r border-gray-200 overflow-y-auto max-h-[97vh] custom-scrollbar bg-[#ebfcff] rounded-3xl">
                    <div className="bg-[#ebfcff] sticky top-0 z-10 border-b border-gray-200">
                        <div className="p-4 pb-2">
                            <p className="text-gray-600 font-bold text-xl text-center mb-3">Messages</p>
                        </div>
                        <div className="px-4 pb-4">
                            <div className="relative">
                                <FontAwesomeIcon
                                    icon={faSearch}
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"
                                />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 text-gray-600 rounded-full focus:outline-none "
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1 p-2">
                        {userList.map(user => (

                            <div
                                key={user.id}
                                className={`p-3 cursor-pointer rounded-md flex space-x-3 hover:bg-[#059fdb] hover:text-white text-gray-600 ${selectedUser.id === user.id ? 'bg-[#0085b9] text-white rounded-md' : ''}`}
                                onClick={() => setSelectedUser(user)}
                            >
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                                <span className="text-[#0085b9] font-semibold text-lg">
                                    {user.name.split(' ').map(n => n[0]).join('')}
                                </span>
                                </div>
                                <div className="flex-1">
                                <div className="flex justify-between items-center rounded-md">
                                    <h2 className="text-base font-semibold ">{user.name}</h2>
                                    <span className="text-xs ">{user.time}</span>
                                </div>
                                <p className=" text-sm truncate">{user.lastMessage}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
         )

    const showChatWindow = () =>
        (
            <div className="w-full flex flex-col h-full custom-scrollbar border-gray-200  shadow bg-white rounded-lg">
                <div className="p-4 border-b bg-[#0085b9] text-white rounded-t-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                                <span className="text-[#0085b9] font-semibold text-lg">
                                    {selectedUser.name.split(' ').map(n => n[0]).join('')}
                                </span>
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold">{selectedUser.name}</h2>
                                <div className="flex items-center space-x-2">
                                    {/*<div className="w-2 h-2 bg-green-400 rounded-full"></div>*/}
                                    {/*<span className="text-sm text-gray-200">Online</span>*/}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button className="p-2 hover:bg-[#006f8f] rounded-full transition-colors cursor-pointer">
                                <FontAwesomeIcon icon={faVideo} className="text-white text-lg" />
                            </button>
                            <button className="p-2 hover:bg-[#006f8f] rounded-full transition-colors cursor-pointer">
                                <FontAwesomeIcon icon={faPhone} className="text-white text-lg" />
                            </button>
                            <button className="p-2 hover:bg-[#006f8f] rounded-full transition-colors cursor-pointer">
                                <FontAwesomeIcon icon={faEllipsisV} className="text-white text-lg" />
                            </button>
                        </div>
                    </div>
                </div>
                <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
                    {messages.map(message => (
                        <div
                            key={message.id}
                                className={`max-w-xs rounded-lg p-3 ${message.sender === 'doctor' ? 'ml-auto bg-blue-500 text-white' : 'mr-auto bg-gray-200 text-gray-800'} flex-col`}
                        >
                            <p>{message.text}</p>
                            <span className="text-xs text-gray-600">{message.time}</span>

                        </div>
                    ))}
                </div>
                <div className="p-4 border-t">
                    <form className="flex">
                        <input
                            type="text"
                            placeholder="Type your message..."
                            className="flex-1 border border-gray-300 rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
                        />
                        <button
                            type="submit"
                            className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Send
                        </button>
                    </form>
                </div>
            </div>
        )

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4  w-full rounded-xl">

            <div className="lg:col-span-1">
                {showUserList()}
            </div>
            <div className="ml-[20px] lg:col-span-3 min-h-[694px] ">
                {showChatWindow()}
            </div>
        </div>
    );


}