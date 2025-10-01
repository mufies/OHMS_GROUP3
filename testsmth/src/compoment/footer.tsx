import React from 'react';

const footer: React.FC = () => (
    <footer className="bg-gray-50 text-sm text-gray-600 mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-y-10">
            {/* Column 1 – Company info */}
            <div className="space-y-2">
                <h3 className="font-semibold text-gray-800">
                    CÔNG TY TNHH YOUMED VIỆT NAM
                </h3>

                <p>
                    <span className="font-semibold">VPDD:</span> 3/1 Thành Thái, P.14,
                    Q.10, TP.HCM
                </p>
                <p>
                    <span className="font-semibold">Hotline:</span> 1900-2805 (8:00-17:30 từ T2 đến T7)
                </p>
                <p>
                    Số ĐKKD 0315286642 do Sở Kế hoạch và Đầu tư TP.HCM cấp lần đầu ngày
                    14/09/2018.
                </p>
                <p>
                    Chịu trách nhiệm nội dung: Dược sĩ Dương Anh Hoàng.
                </p>

                {/* Social icons */}
                <div className="flex space-x-4 pt-4">
                    {/* Replace with your SVGs or icon components */}
                    <a aria-label="Facebook" href="#" className="hover:text-blue-600">
                        {/* Facebook SVG */}
                    </a>
                    <a aria-label="YouTube" href="#" className="hover:text-red-600">
                        {/* YouTube SVG */}
                    </a>
                    <a aria-label="LinkedIn" href="#" className="hover:text-blue-700">
                        {/* LinkedIn SVG */}
                    </a>
                    <a aria-label="Zalo" href="#" className="hover:text-blue-500">
                        {/* Zalo SVG */}
                    </a>
                </div>
            </div>

            {/* Column 2 – About */}
            <div>
                <h4 className="font-semibold text-gray-800 mb-2">Về YouMed</h4>
                <ul className="space-y-1">
                    <li><a className="hover:text-teal-600" href="#">Giới thiệu về YouMed</a></li>
                    <li><a className="hover:text-teal-600" href="#">Ban điều hành</a></li>
                    <li><a className="hover:text-teal-600" href="#">Nhân sự &amp; Tuyển dụng</a></li>
                    <li><a className="hover:text-teal-600" href="#">Liên hệ</a></li>
                </ul>
            </div>

            {/* Column 3 – Services */}
            <div>
                <h4 className="font-semibold text-gray-800 mb-2">Dịch vụ</h4>
                <ul className="space-y-1">
                    <li><a className="hover:text-teal-600" href="#">Đặt khám bác sĩ</a></li>
                    <li><a className="hover:text-teal-600" href="#">Đặt khám bệnh viện</a></li>
                    <li><a className="hover:text-teal-600" href="#">Đặt khám phòng khám</a></li>
                    <li><a className="hover:text-teal-600" href="#">Y360</a></li>
                    <li><a className="hover:text-teal-600" href="#">YouMed Clinic</a></li>
                </ul>
            </div>

            {/* Column 4 – Support */}
            <div>
                <h4 className="font-semibold text-gray-800 mb-2">Hỗ trợ</h4>
                <ul className="space-y-1">
                    <li><a className="hover:text-teal-600" href="#">Câu hỏi thường gặp</a></li>
                    <li><a className="hover:text-teal-600" href="#">Điều khoản sử dụng</a></li>
                    <li><a className="hover:text-teal-600" href="#">Chính sách bảo mật</a></li>
                    <li><a className="hover:text-teal-600" href="#">Chính sách giải quyết khiếu nại</a></li>
                    <li><a className="hover:text-teal-600" href="mailto:cskh@youmed.vn">
                        Hỗ trợ khách hàng: cskh@youmed.vn
                    </a></li>
                </ul>
            </div>
        </div>

        <div className="border-t border-gray-200 pt-6 pb-10 text-center space-y-3">
            <p className="max-w-4xl mx-auto">
                Các thông tin trên YouMed chỉ dành cho mục đích tham khảo, tra cứu và không thay thế
                cho việc chẩn đoán hoặc điều trị y khoa. Cần tuyệt đối tuân theo hướng dẫn của Bác sĩ và
                Nhân viên y tế.
            </p>
            <p className="font-medium text-gray-700">
                Copyright © 2018 - 2025 Công ty TNHH YouMed Việt Nam.
            </p>

            <div className="flex justify-center space-x-4 pt-2">
                <img src="/badges/da-dang-ky.png" alt="Đã đăng ký" className="h-7" />
                <img src="/badges/dmca-protected.png" alt="DMCA protected" className="h-7" />
            </div>
        </div>
    </footer>
);

export default footer;
