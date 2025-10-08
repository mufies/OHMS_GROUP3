import {useState, useEffect} from "react";
import '../customScrollBar.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faSearch, faVideo, faPhone, faEllipsisV} from '@fortawesome/free-solid-svg-icons';
export default function doctorChatPage() {
    const initialUserList = [
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

    // State for user list and loading
    const [userList, setUserList] = useState(initialUserList);
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState(initialUserList[0]);

    const doctorChatList = async () => {
        try {
            setLoading(true);

            const response = await fetch('/api/doctor/chat/users');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            setUserList(data);
            return data;
        } catch (error) {
            console.error('Error fetching chat list:', error);
            setUserList(initialUserList);
            throw error;
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        doctorChatList();
    }, []);


     const showUserList = () =>
         (
                <div className="w-full border-r border-gray-200 overflow-y-auto max-h-[97vh] custom-scrollbar bg-white">
                    <div className="bg-white sticky top-0 z-10 border-b border-gray-200">
                        <div className="p-4 pb-2">
                            <p className="text-gray-800 font-semibold text-lg">Messages</p>
                        </div>
                        <div className="px-4 pb-4">
                            <div className="relative">
                                <FontAwesomeIcon
                                    icon={faSearch}
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"
                                />
                                <input
                                    type="text"
                                    placeholder="Search conversations..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 text-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1 p-2">
                        {loading ? (
                            <div className="flex justify-center p-4">
                                <span className="text-gray-500">Loading chats...</span>
                            </div>
                        ) : (
                            userList.map((user, index) => (
                                <div
                                    key={user.id}
                                    className={`p-3 cursor-pointer rounded-lg flex space-x-3 hover:bg-blue-50 text-gray-600 transition-colors ${selectedUser.id === user.id ? 'bg-blue-100 border-l-4 border-blue-500' : ''}`}
                                    onClick={() => setSelectedUser(user)}
                                >
                                <div className="relative">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-blue-600 font-semibold text-sm">
                                            {user.name.split(' ').map(n => n[0]).join('')}
                                        </span>
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-sm font-medium text-gray-900 truncate">{user.name}</h3>
                                        <span className="text-xs text-gray-500">{user.time}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate mt-1">{user.lastMessage}</p>

                                </div>
                            </div>
                            ))
                        )}
                    </div>
                </div>
         )

    const showChatWindow = () =>
        (
            <div className="w-full flex flex-col h-full custom-scrollbar border-gray-200 shadow bg-white">
                <div className="p-4 border-b bg-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="relative">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 font-semibold text-sm">
                                        {selectedUser.name.split(' ').map(n => n[0]).join('')}
                                    </span>
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">{selectedUser.name}</h2>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-green-600">Online</span>
                                    <span className="text-sm text-gray-500">Patient ID: #28475</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
                                <FontAwesomeIcon icon={faPhone} className="text-gray-600 text-lg" />
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
                                <FontAwesomeIcon icon={faVideo} className="text-gray-600 text-lg" />
                            </button>

                        </div>
                    </div>
                </div>
                <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar bg-gray-50">
                    <div className="flex justify-start">
                        <div className="flex items-start space-x-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-blue-600 font-semibold text-xs">ER</span>
                            </div>
                            <div className="bg-white rounded-lg p-3 shadow-sm max-w-xs">
                                <p className="text-sm text-gray-800">Hello Dr. Anderson, I wanted to follow up on my recent visit</p>
                                <span className="text-xs text-gray-500 mt-1 block">10:30 AM</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-end">
                        <div className="bg-blue-500 rounded-lg p-3 max-w-xs">
                            <p className="text-sm text-white">Hello Emily! Of course, how are you feeling today?</p>
                            <span className="text-xs text-blue-100 mt-1 block">10:32 AM</span>
                        </div>
                    </div>

                    <div className="flex justify-start">
                        <div className="flex items-start space-x-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-blue-600 font-semibold text-xs">ER</span>
                            </div>
                            <div className="bg-white rounded-lg p-3 shadow-sm max-w-xs">
                                <p className="text-sm text-gray-800">Much better actually. The medication you prescribed is working well</p>
                                <span className="text-xs text-gray-500 mt-1 block">10:33 AM</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-start">
                        <div className="flex items-start space-x-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-blue-600 font-semibold text-xs">ER</span>
                            </div>
                            <div className="bg-white rounded-lg p-3 shadow-sm max-w-xs">
                                <p className="text-sm text-gray-800">I wanted to ask about the dosage though</p>
                                <span className="text-xs text-gray-500 mt-1 block">10:33 AM</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <div className="bg-blue-500 rounded-lg p-3 max-w-sm">
                            <p className="text-sm text-white">That's great to hear! What would you like to know about the dosage?</p>
                            <span className="text-xs text-blue-100 mt-1 block">10:35 AM</span>
                        </div>
                    </div>

                    <div className="flex justify-start">
                        <div className="flex items-start space-x-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-blue-600 font-semibold text-xs">ER</span>
                            </div>
                            <div className="bg-white rounded-lg p-3 shadow-sm max-w-xs">
                                <p className="text-sm text-gray-800">Should I continue taking it twice a day or can I reduce it to once?</p>
                                <span className="text-xs text-gray-500 mt-1 block">10:36 AM</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <div className="bg-blue-500 rounded-lg p-3 max-w-lg">
                            <p className="text-sm text-white">Let's continue with twice a day for another week, then we can reassess. It's important to maintain consistent levels in your system.</p>
                            <span className="text-xs text-blue-100 mt-1 block">10:38 AM</span>
                        </div>
                    </div>

                    <div className="flex justify-start">
                        <div className="flex items-start space-x-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-blue-600 font-semibold text-xs">ER</span>
                            </div>
                            <div className="bg-white rounded-lg p-3 shadow-sm max-w-xs">
                                <p className="text-sm text-gray-800">Thank you doctor, I'm feeling much better now</p>
                                <span className="text-xs text-gray-500 mt-1 block">10:40 AM</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t bg-white">
                    <div className="flex items-center space-x-2">
                        <button className="p-2 text-gray-400 hover:text-gray-600">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
                            </svg>
                        </button>
                        <input
                            type="text"
                            placeholder="Type your message..."
                            className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                        />
                        <button className="p-2 text-gray-400 hover:text-gray-600">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                            </svg>
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        )

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 w-full rounded-xl">

            <div className="lg:col-span-1">
                {showUserList()}
            </div>
            <div className="ml-[20px] lg:col-span-3 min-h-[694px] ">
                {showChatWindow()}
            </div>
        </div>
    );


}