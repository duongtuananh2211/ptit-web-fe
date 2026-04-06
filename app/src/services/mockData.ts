export const getProjects = async () => {
  return [
    {
      id: 1,
      title: 'Horus Cloud Migration',
      tasks: {
        todo: [
          {
            id: 1,
            title: 'Update documentation for API endpoints v2.4',
            priority: 'Low',
            date: 'Oct 12',
            assignee: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC95FYpIJBgzag9nda_U-qDFppVeCuoZTs6o4q3nu4drfv2oJwT3iPWN1YOKKs0UDEaw44cVBlarz5g7glzEz3Jkts0vxzreFSzstGvBKxRlY5o5Y5XV4ouk0nEztUzG3Bc9ByqZ-wibs1iCG6S7Ew_mP1zXPmWRLRCC38zLP5TfhWtVFgFxNdszqxbrdxuSol07NoHhOarZcJyO3HorMs1wrGlsE9ffxLBwET__6SEeFH1O3QNZwV2rS3PM0rmxnZzWf5MOHB2qg0w'
          },
          {
            id: 2,
            title: 'Weekly sync with stakeholders',
            priority: 'Low',
            date: 'Oct 15',
            assignees: [
              'https://lh3.googleusercontent.com/aida-public/AB6AXuCCwW3luc20F64YRemzbmp5IMWa6IFv4QfgNKkMa1aDuPIHZ1xLyWz-7bTbGc54qRG6DobwbAgYIZS9khwobzUdVPG84JNsF2EPAXnSWvU4z-ja2AO6Vs1PDOkXHUe8VEmQc8SdJp4ClLeV1hdF9mPhXuCiXsnrcdvF0GNbDfshrjKbB0einv_5JGuJjnJtfAG52lTz0DmCScdcC1j_xR-IlY7ukKjnR7ccF0eaBw9h0L9BFF9Lvbooz06hbd3LIfgVjLLFgAwNbBnm',
              'https://lh3.googleusercontent.com/aida-public/AB6AXuDlkx6EmkhwP5-HYyZNVzRAXv7pDBHvHzIt0WfBiaHqgh-Kw2My7roY1-p5FyWOJKR_qcrz47b21E5g5vhN7monIwd0I6Jlp4-amGW3RbgAzkjbq_tIX8u-J17A33TMpPXiNUXvRM7kRan3w-PD-Q1smKmei6vjSJpxu5kn-uqFyLlj4xbOCAsxprVR00rjwJv5yEXv_IHklb51uKwoB5odpuxn23XZnMm82rAKHovT6uV6doiDbjcV9qeBMflgYtwKOI2Yfh0-r3aN'
            ]
          }
        ],
        working: [
          {
            id: 3,
            title: 'Infrastructure Security Audit',
            priority: 'Critical',
            progress: 65,
            due: 'Due Today',
            assignee: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDw4YhwVU2nwnqDyHdf_8PXe34iMb4ZJg2J5-yxDjEPGIuI2DD6lTFLddOdmcPnVjQ6ccrHnBQFKS0HQ6YQVfHxj7lhz2oMVNzdnv4KCuMNguXCiQaAzIf-bVzvGUUlnUOnUTbCsNZnPnO12cYb80qB3zpV0obwsYvvwshxBpiBl89DCXs6PG1n520R-clWAbwipVZl-lbxdHiRJQMfyJfjKeHl0hP7FYT-DvGt22FTbWlOfr2l4oyRer8xJLbinlc8Aiz1sImzniSO'
          },
          {
            id: 4,
            title: 'Refactoring Auth Service',
            priority: 'High',
            date: 'Oct 14',
            assignee: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWM_ajOBTrx8DC-p9eQdxI5xL_XGVJLMBhwIcBItBbBeGIXRghDnafHhNqXTrqe9Dt2MydUaZ49ApcoUm7RK9uniAFt8uWRZnW0DG1TmiZa_sLQ5NmQutnkwVjJOA2TnF7AWhNMHjfzGF8Rfrq4G7b_wOJ9CucyyMVrmgxT97ujjmJ4wE8YVGe_deY-ZxXDEgbEPAG5P9BHRspuwib19ZWvOnlLzxK3fsZJjXl7K-7tOBkUUgQqvqbqU_BbnFfDjTzWLMmR8oOzEw3'
          }
        ],
        stuck: [
          {
            id: 5,
            title: 'Third-party payment gateway integration',
            priority: 'High',
            warning: 'Awaiting API Keys from Provider',
            date: 'Oct 08',
            assignee: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCh78VFGkuleVw7-TGm1y_nwKWiFeFjqleC7PIzf0hey2KFLUYsNixvy2JJimtDeMX8QuvSPPsbs8yhzyhyRaU3fvE37ebdPmxWgXBONIwrtP0gzk_btDcC2wLx23y-BiuNtqlSjpkKJIoI-7fbTyUelyDWwxWuAmZSctdL9qZ544pr6G1C6ymiEPWpBbYs1qXHwJ3LqWwBUPpIkSVNOUrGIiaF8ZASmODzXaZH2PHbgVKWQq6VypBbsE3EGssfJRnSQiFeu86JO4Yl'
          }
        ],
        done: [
          {
            id: 6,
            title: 'Design system token mapping',
            priority: 'Low',
            completed: 'Completed Oct 10',
            assignee: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCuIcViAAwzG8AyUFKdS82rSeezo8XANFv2MEp7lTBnUTGomCsY4KLHqFfTq3ve2IfLHq2znf5lNEiXY5dcf9JzMlcB5g7RfOGwekgf9vTspw3_dANDBeQKkTHx_0dB7Md2mhVOp0VmmmwtUAjBCCWCn5Sm-3TwbSkFuOFJoS9YffSOr-hdkL3nMT_Z3aqhcylKglKt2_1SsU0NOICLspGl2Zz6En3_-GA9F3Mc5v_SbzUlI95X16U8ylRHz0SaDJo8FBOxbjeP1HLL'
          }
        ]
      }
    }
  ];
};

export const getStats = async () => {
  return {
    activeBugs: 142,
    avgTimeToClose: '4.2d',
    taskVelocity: '88%',
    criticalPriority: 12,
    bugDensity: [
      { label: 'Core Dashboard', value: 40, color: '#003d9b' },
      { label: 'Data Processing', value: 25, color: '#525f73' },
      { label: 'Auth & Access', value: 15, color: '#ba1a1a' },
      { label: 'UI Components', value: 20, color: '#8c001d' },
    ],
    teamPerformance: [
      { name: 'Platform Alpha Team', pts: 42, percentage: 84 },
      { name: 'Core Infrastructure', pts: 38, percentage: 76 },
      { name: 'Mobile Solutions', pts: 24, percentage: 48 },
      { name: 'Analytics Squad', pts: 51, percentage: 100 },
    ],
    criticalIssues: [
      { id: 'HV-492', title: 'API Gateway Latency Spike', type: 'Infrastructure', time: '2h ago', priority: 'CRITICAL', bgColor: 'bg-error-container', textColor: 'text-error' },
      { id: 'HV-501', title: 'Authentication Bypass Vulnerability', type: 'Security', time: '5h ago', priority: 'CRITICAL', bgColor: 'bg-tertiary-fixed', textColor: 'text-tertiary' },
      { id: 'HV-488', title: 'Memory Leak in UI Canvas', type: 'Frontend', time: '1d ago', priority: 'HIGH', bgColor: 'bg-secondary-fixed', textColor: 'text-on-secondary-container' },
    ]
  };
};

export const getUsers = async () => {
  return [
    { id: 1, name: 'Alex Thompson', role: 'Security Architect', status: 'Active Now', email: 'a.thompson@horusvis.io', access: 'Super Admin', activity: 'High', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDw4YhwVU2nwnqDyHdf_8PXe34iMb4ZJg2J5-yxDjEPGIuI2DD6lTFLddOdmcPnVjQ6ccrHnBQFKS0HQ6YQVfHxj7lhz2oMVNzdnv4KCuMNguXCiQaAzIf-bVzvGUUlnUOnUTbCsNZnPnO12cYb80qB3zpV0obwsYvvwshxBpiBl89DCXs6PG1n520R-clWAbwipVZl-lbxdHiRJQMfyJfjKeHl0hP7FYT-DvGt22FTbWlOfr2l4oyRer8xJLbinlc8Aiz1sImzniSO' },
    { id: 2, name: 'Sarah Chen', role: 'Lead DevOps', status: 'Away', email: 's.chen@horusvis.io', access: 'Admin', activity: 'Medium', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWM_ajOBTrx8DC-p9eQdxI5xL_XGVJLMBhwIcBItBbBeGIXRghDnafHhNqXTrqe9Dt2MydUaZ49ApcoUm7RK9uniAFt8uWRZnW0DG1TmiZa_sLQ5NmQutnkwVjJOA2TnF7AWhNMHjfzGF8Rfrq4G7b_wOJ9CucyyMVrmgxT97ujjmJ4wE8YVGe_deY-ZxXDEgbEPAG5P9BHRspuwib19ZWvOnlLzxK3fsZJjXl7K-7tOBkUUgQqvqbqU_BbnFfDjTzWLMmR8oOzEw3' },
    { id: 3, name: 'Marcus Wright', role: 'Infrastructure Eng.', status: 'Offline', email: 'm.wright@horusvis.io', access: 'Editor', activity: 'Low', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCCwW3luc20F64YRemzbmp5IMWa6IFv4QfgNKkMa1aDuPIHZ1xLyWz-7bTbGc54qRG6DobwbAgYIZS9khwobzUdVPG84JNsF2EPAXnSWvU4z-ja2AO6Vs1PDOkXHUe8VEmQc8SdJp4ClLeV1hdF9mPhXuCiXsnrcdvF0GNbDfshrjKbB0einv_5JGuJjnJtfAG52lTz0DmCScdcC1j_xR-IlY7ukKjnR7ccF0eaBw9h0L9BFF9Lvbooz06hbd3LIfgVjLLFgAwNbBnm' },
  ];
};
