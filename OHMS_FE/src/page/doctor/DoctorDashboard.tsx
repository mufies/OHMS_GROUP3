import Navigator from "../../components/doctor/navigator.tsx";
import TodayPatientList from "../../components/doctor/dashboard/todayPatientList.tsx";
import DashboardCalendar from "../../components/doctor/dashboard/dashboardCalendar.tsx";
import DutySchedule from "../../components/doctor/dashboard/DutySchedule.tsx";

function DoctorDashboard() {
    return (
        <div className="flex-col min-h-screen  bg-gray-50">
            <Navigator
                doctorSpecialty="Cardiology"
            />

            <div className="flex-1 ml-64" style={{minWidth: 'calc(99vw - 16rem)'}}>
                <div className="p-6 space-y-6 bg-[#f9fcff]">
                    {/*<div className="grid gap-6 mb-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-2">*/}

                    {/*    <div className="flex flex-col justify-between bg-[#eefdff] rounded-lg border border-[#d2f0f7] shadow-sm p-5">*/}
                    {/*        <p className="text-xs text-gray-500 mb-1">Last month</p>*/}

                    {/*        <p className="text-sm font-medium text-gray-700">*/}
                    {/*            Offline patients*/}
                    {/*        </p>*/}

                    {/*        <div className="flex items-end justify-between mt-2">*/}
                    {/*            <span className="text-3xl font-bold text-gray-900">32</span>*/}

                    {/*            /!* change-since badge *!/*/}
                    {/*            <span className="flex items-center text-xs text-red-600 ml-2">*/}
                    {/*                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">*/}
                    {/*                  <path d="M5 8l5 5 5-5H5z" />   /!* down caret *!/*/}
                    {/*                </svg>*/}
                    {/*                –6.5%*/}
                    {/*              </span>*/}
                    {/*        </div>*/}
                    {/*    </div>*/}


                    {/*    <div className="flex flex-col justify-between bg-[#eefdff] rounded-lg border border-[#d2f0f7] shadow-sm p-5">*/}
                    {/*        <p className="text-xs text-gray-500 mb-1">Last month</p>*/}

                    {/*        <p className="text-sm font-medium text-gray-700">*/}
                    {/*            Online patients*/}
                    {/*        </p>*/}

                    {/*        <div className="flex items-end justify-between mt-2">*/}
                    {/*            <span className="text-3xl font-bold text-gray-900">210</span>*/}

                    {/*            <span className="flex items-center text-xs text-blue-600 ml-2">*/}
                    {/*    <svg className="w-3 h-3 mr-1 rotate-180" fill="currentColor" viewBox="0 0 20 20">*/}
                    {/*      <path d="M5 8l5 5 5-5H5z" />   /!* up caret *!/*/}
                    {/*    </svg>*/}
                    {/*    +31.3%*/}
                    {/*  </span>*/}
                    {/*        </div>*/}
                    {/*    </div>*/}

                    {/*</div>*/}


                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full justify-center ">

                        <div className="lg:col-span-2 ">
                            <TodayPatientList />
                            <div className="w-full mt-6">
                                <DutySchedule/>
                            </div>
                        </div>
                        <div className="lg:col-span-1">
                            <DashboardCalendar/>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}

export default DoctorDashboard;
