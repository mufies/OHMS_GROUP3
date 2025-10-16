
export default function searchDoctor() {
    return (
        <section className="relative overflow-hidden bg-[#1273db] ">
            {/* Decorative curves */}
<div className="mx-auto flex w-[99vw]  items-center gap-8 px-4 py-24 sm:grid-cols-2 lg:px-8 justify-center align-middle">
                {/* Copy + search box */}
                <div className="text-center  flex flex-col justify-items-center align-items-center ">
                    <h1 className="mb-4 text-4xl font-bold leading-tight text-white">
                        Đặt khám bác sĩ
                    </h1>
                    <p className="mb-8 text-white/90">
                        Đặt khám với hơn <strong>1,000</strong> bác sĩ đã kết nối chính thức
                        với OHMS để có số thứ tự và khung giờ khám trước
                    </p>

                    <div className="relative mx-auto max-w-xl min-w-[500px]">
                        <input
                            type="text"
                            placeholder="Triệu chứng, bác sĩ"
                            className="w-full rounded-full border border-white/40 bg-white/90 px-6 py-3 pr-12 text-sm text-gray-700 placeholder-gray-500 shadow focus:border-teal-500 focus:ring-teal-500"
                        />
                        <button
                            aria-label="Tìm kiếm"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-teal-600"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18.5a7.5 7.5 0 006.15-3.85z"
                                />
                            </svg>
                        </button>
                    </div>
                </div>


            </div>
        </section>
    );
}
