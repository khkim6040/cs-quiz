// prisma/seed-data/concepts.ts
// 9개 토픽별 세부 개념 데이터 (bilingual)

export interface ConceptSeedData {
  topicId: string;
  name_ko: string;
  name_en: string;
}

export const conceptsSeedData: ConceptSeedData[] = [
  // === Database ===
  { topicId: 'database', name_ko: '정규화', name_en: 'Normalization' },
  { topicId: 'database', name_ko: 'SQL 기초', name_en: 'SQL Basics' },
  { topicId: 'database', name_ko: '트랜잭션/ACID', name_en: 'Transactions/ACID' },
  { topicId: 'database', name_ko: '인덱싱', name_en: 'Indexing' },
  { topicId: 'database', name_ko: 'JOIN 연산', name_en: 'JOIN Operations' },
  { topicId: 'database', name_ko: 'MVCC', name_en: 'MVCC' },
  { topicId: 'database', name_ko: '데드락', name_en: 'Deadlock' },
  { topicId: 'database', name_ko: 'WAL 프로토콜', name_en: 'WAL Protocol' },
  { topicId: 'database', name_ko: 'B-Tree', name_en: 'B-Tree' },
  { topicId: 'database', name_ko: '관계대수', name_en: 'Relational Algebra' },
  { topicId: 'database', name_ko: 'ER 모델링', name_en: 'ER Modeling' },
  { topicId: 'database', name_ko: '서브쿼리', name_en: 'Subqueries' },
  { topicId: 'database', name_ko: 'CTE/재귀 쿼리', name_en: 'CTE/Recursive Queries' },
  { topicId: 'database', name_ko: '뷰와 머티리얼라이즈드 뷰', name_en: 'Views & Materialized Views' },
  { topicId: 'database', name_ko: '분산 데이터베이스', name_en: 'Distributed Databases' },

  // === Algorithm ===
  { topicId: 'algorithm', name_ko: '정렬 알고리즘', name_en: 'Sorting Algorithms' },
  { topicId: 'algorithm', name_ko: '탐색 알고리즘', name_en: 'Search Algorithms' },
  { topicId: 'algorithm', name_ko: '그래프 알고리즘', name_en: 'Graph Algorithms' },
  { topicId: 'algorithm', name_ko: '동적 프로그래밍', name_en: 'Dynamic Programming' },
  { topicId: 'algorithm', name_ko: '그리디 알고리즘', name_en: 'Greedy Algorithms' },
  { topicId: 'algorithm', name_ko: '분할 정복', name_en: 'Divide and Conquer' },
  { topicId: 'algorithm', name_ko: '백트래킹', name_en: 'Backtracking' },
  { topicId: 'algorithm', name_ko: '시간/공간 복잡도', name_en: 'Time/Space Complexity' },
  { topicId: 'algorithm', name_ko: '최단 경로', name_en: 'Shortest Path' },
  { topicId: 'algorithm', name_ko: '최소 신장 트리', name_en: 'Minimum Spanning Tree' },
  { topicId: 'algorithm', name_ko: '문자열 매칭', name_en: 'String Matching' },
  { topicId: 'algorithm', name_ko: '위상 정렬', name_en: 'Topological Sort' },

  // === Computer Security ===
  { topicId: 'computerSecurity', name_ko: '대칭/비대칭 암호화', name_en: 'Symmetric/Asymmetric Encryption' },
  { topicId: 'computerSecurity', name_ko: 'XSS', name_en: 'Cross-Site Scripting (XSS)' },
  { topicId: 'computerSecurity', name_ko: 'SQL 인젝션', name_en: 'SQL Injection' },
  { topicId: 'computerSecurity', name_ko: '방화벽', name_en: 'Firewalls' },
  { topicId: 'computerSecurity', name_ko: 'VPN', name_en: 'VPN' },
  { topicId: 'computerSecurity', name_ko: '인증/인가', name_en: 'Authentication/Authorization' },
  { topicId: 'computerSecurity', name_ko: 'CSRF', name_en: 'CSRF' },
  { topicId: 'computerSecurity', name_ko: '버퍼 오버플로', name_en: 'Buffer Overflow' },
  { topicId: 'computerSecurity', name_ko: 'PKI/인증서', name_en: 'PKI/Certificates' },
  { topicId: 'computerSecurity', name_ko: '해시 함수', name_en: 'Hash Functions' },
  { topicId: 'computerSecurity', name_ko: 'OAuth/JWT', name_en: 'OAuth/JWT' },
  { topicId: 'computerSecurity', name_ko: '네트워크 보안', name_en: 'Network Security' },
  { topicId: 'computerSecurity', name_ko: '사이드채널 공격', name_en: 'Side-Channel Attacks' },

  // === Data Structure ===
  { topicId: 'dataStructure', name_ko: '배열', name_en: 'Arrays' },
  { topicId: 'dataStructure', name_ko: '링크드 리스트', name_en: 'Linked Lists' },
  { topicId: 'dataStructure', name_ko: '스택', name_en: 'Stacks' },
  { topicId: 'dataStructure', name_ko: '큐/데크', name_en: 'Queues/Deques' },
  { topicId: 'dataStructure', name_ko: '이진 트리', name_en: 'Binary Trees' },
  { topicId: 'dataStructure', name_ko: '해시 테이블', name_en: 'Hash Tables' },
  { topicId: 'dataStructure', name_ko: '힙/우선순위 큐', name_en: 'Heaps/Priority Queues' },
  { topicId: 'dataStructure', name_ko: '그래프', name_en: 'Graphs' },
  { topicId: 'dataStructure', name_ko: '트라이', name_en: 'Tries' },
  { topicId: 'dataStructure', name_ko: 'AVL/레드블랙 트리', name_en: 'AVL/Red-Black Trees' },
  { topicId: 'dataStructure', name_ko: '유니온 파인드', name_en: 'Union-Find' },
  { topicId: 'dataStructure', name_ko: '세그먼트 트리', name_en: 'Segment Trees' },

  // === Computer Networking ===
  { topicId: 'computerNetworking', name_ko: 'TCP/IP', name_en: 'TCP/IP' },
  { topicId: 'computerNetworking', name_ko: 'HTTP/HTTPS', name_en: 'HTTP/HTTPS' },
  { topicId: 'computerNetworking', name_ko: 'DNS', name_en: 'DNS' },
  { topicId: 'computerNetworking', name_ko: '라우팅 프로토콜', name_en: 'Routing Protocols' },
  { topicId: 'computerNetworking', name_ko: '소켓 프로그래밍', name_en: 'Socket Programming' },
  { topicId: 'computerNetworking', name_ko: 'TLS/SSL', name_en: 'TLS/SSL' },
  { topicId: 'computerNetworking', name_ko: 'NAT', name_en: 'NAT' },
  { topicId: 'computerNetworking', name_ko: '로드 밸런싱', name_en: 'Load Balancing' },
  { topicId: 'computerNetworking', name_ko: 'OSI 7계층', name_en: 'OSI 7 Layers' },
  { topicId: 'computerNetworking', name_ko: 'UDP', name_en: 'UDP' },
  { topicId: 'computerNetworking', name_ko: 'ARP/ICMP', name_en: 'ARP/ICMP' },
  { topicId: 'computerNetworking', name_ko: 'WebSocket', name_en: 'WebSocket' },

  // === Operating System ===
  { topicId: 'operatingSystem', name_ko: '프로세스 관리', name_en: 'Process Management' },
  { topicId: 'operatingSystem', name_ko: '스레드', name_en: 'Threads' },
  { topicId: 'operatingSystem', name_ko: '메모리 관리', name_en: 'Memory Management' },
  { topicId: 'operatingSystem', name_ko: '파일 시스템', name_en: 'File Systems' },
  { topicId: 'operatingSystem', name_ko: 'CPU 스케줄링', name_en: 'CPU Scheduling' },
  { topicId: 'operatingSystem', name_ko: '동기화/뮤텍스', name_en: 'Synchronization/Mutex' },
  { topicId: 'operatingSystem', name_ko: '가상 메모리', name_en: 'Virtual Memory' },
  { topicId: 'operatingSystem', name_ko: 'IPC', name_en: 'Inter-Process Communication' },
  { topicId: 'operatingSystem', name_ko: '페이지 교체', name_en: 'Page Replacement' },
  { topicId: 'operatingSystem', name_ko: '커널 구조', name_en: 'Kernel Architecture' },
  { topicId: 'operatingSystem', name_ko: 'Inode/디스크 관리', name_en: 'Inode/Disk Management' },
  { topicId: 'operatingSystem', name_ko: '인터럽트 처리', name_en: 'Interrupt Handling' },

  // === Computer Architecture ===
  { topicId: 'computerArchitecture', name_ko: 'CPU 파이프라인', name_en: 'CPU Pipeline' },
  { topicId: 'computerArchitecture', name_ko: '캐시 메모리', name_en: 'Cache Memory' },
  { topicId: 'computerArchitecture', name_ko: '명령어 집합(ISA)', name_en: 'Instruction Set (ISA)' },
  { topicId: 'computerArchitecture', name_ko: '메모리 계층 구조', name_en: 'Memory Hierarchy' },
  { topicId: 'computerArchitecture', name_ko: '병렬 처리', name_en: 'Parallel Processing' },
  { topicId: 'computerArchitecture', name_ko: '인터럽트', name_en: 'Interrupts' },
  { topicId: 'computerArchitecture', name_ko: '분기 예측', name_en: 'Branch Prediction' },
  { topicId: 'computerArchitecture', name_ko: '버스 구조', name_en: 'Bus Architecture' },
  { topicId: 'computerArchitecture', name_ko: 'RISC vs CISC', name_en: 'RISC vs CISC' },
  { topicId: 'computerArchitecture', name_ko: '부동소수점 연산', name_en: 'Floating Point Arithmetic' },

  // === Software Engineering ===
  { topicId: 'softwareEngineering', name_ko: '디자인 패턴', name_en: 'Design Patterns' },
  { topicId: 'softwareEngineering', name_ko: 'TDD', name_en: 'Test-Driven Development' },
  { topicId: 'softwareEngineering', name_ko: 'CI/CD', name_en: 'CI/CD' },
  { topicId: 'softwareEngineering', name_ko: '리팩토링', name_en: 'Refactoring' },
  { topicId: 'softwareEngineering', name_ko: '아키텍처 패턴', name_en: 'Architecture Patterns' },
  { topicId: 'softwareEngineering', name_ko: 'SOLID 원칙', name_en: 'SOLID Principles' },
  { topicId: 'softwareEngineering', name_ko: '요구공학', name_en: 'Requirements Engineering' },
  { topicId: 'softwareEngineering', name_ko: '애자일/스크럼', name_en: 'Agile/Scrum' },
  { topicId: 'softwareEngineering', name_ko: 'UML', name_en: 'UML' },
  { topicId: 'softwareEngineering', name_ko: '코드 리뷰', name_en: 'Code Review' },
  { topicId: 'softwareEngineering', name_ko: '클린 코드', name_en: 'Clean Code' },

  // === Spring Boot ===
  { topicId: 'springBoot', name_ko: 'IoC/DI', name_en: 'IoC/DI' },
  { topicId: 'springBoot', name_ko: 'AOP', name_en: 'AOP' },
  { topicId: 'springBoot', name_ko: 'Spring Data JPA', name_en: 'Spring Data JPA' },
  { topicId: 'springBoot', name_ko: 'Spring Security', name_en: 'Spring Security' },
  { topicId: 'springBoot', name_ko: 'Spring MVC', name_en: 'Spring MVC' },
  { topicId: 'springBoot', name_ko: '자동 설정', name_en: 'Auto Configuration' },
  { topicId: 'springBoot', name_ko: '액추에이터', name_en: 'Actuator' },
  { topicId: 'springBoot', name_ko: '프로파일', name_en: 'Profiles' },
  { topicId: 'springBoot', name_ko: 'Bean 생명주기', name_en: 'Bean Lifecycle' },
  { topicId: 'springBoot', name_ko: 'REST API 설계', name_en: 'REST API Design' },
  { topicId: 'springBoot', name_ko: '트랜잭션 관리', name_en: 'Transaction Management' },
  { topicId: 'springBoot', name_ko: '테스트 전략', name_en: 'Testing Strategies' },
];
