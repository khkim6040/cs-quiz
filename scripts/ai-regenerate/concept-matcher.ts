// scripts/ai-regenerate/concept-matcher.ts
//
// 생성된 문제의 세부 concept 문자열을 시드 concept에 매핑하는 유틸리티
// import.ts와 auto-tag.ts에서 공유

import { PrismaClient } from "@prisma/client";

interface SeedConcept {
  id: string;
  topicId: string;
  name_en: string;
}

// 토픽별 시드 concept 캐시
const conceptCache = new Map<string, SeedConcept[]>();

export async function loadSeedConcepts(prisma: PrismaClient): Promise<void> {
  const concepts = await prisma.concept.findMany({
    select: { id: true, topicId: true, name_en: true },
  });
  conceptCache.clear();
  for (const c of concepts) {
    const list = conceptCache.get(c.topicId) || [];
    list.push(c);
    conceptCache.set(c.topicId, list);
  }
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[()\/&,\-:.']/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

/** Stem: strip trailing 's'/'es' for plural handling */
function stem(word: string): string {
  if (word.endsWith("ies") && word.length > 4) return word.slice(0, -3) + "y";
  if (word.endsWith("es") && word.length > 3) return word.slice(0, -2);
  if (word.endsWith("s") && word.length > 3) return word.slice(0, -1);
  return word;
}

// Keyword aliases: generated concept keyword → seed concept name_en
// Used when automatic matching fails due to different terminology
const KEYWORD_ALIASES: Record<string, Record<string, string>> = {
  algorithm: {
    "quicksort": "Sorting Algorithms",
    "heapsort": "Sorting Algorithms",
    "mergesort": "Sorting Algorithms",
    "sorting": "Sorting Algorithms",
    "comparison-based sorting": "Sorting Algorithms",
    "bfs": "Graph Algorithms",
    "dfs": "Graph Algorithms",
    "traversal": "Graph Algorithms",
    "dijkstra": "Shortest Path",
    "bellman-ford": "Shortest Path",
    "bellman": "Shortest Path",
    "big-o": "Time/Space Complexity",
    "big-ω": "Time/Space Complexity",
    "big-θ": "Time/Space Complexity",
    "notation": "Time/Space Complexity",
    "master theorem": "Time/Space Complexity",
    "recurrence": "Time/Space Complexity",
    "amortized": "Time/Space Complexity",
    "knapsack": "Dynamic Programming",
    "dp principles": "Dynamic Programming",
    "optimal substructure": "Dynamic Programming",
    "overlapping subproblems": "Dynamic Programming",
    "np-complete": "Time/Space Complexity",
    "np-hard": "Time/Space Complexity",
    "union-find": "Graph Algorithms",
    "disjoint set": "Graph Algorithms",
    "hash table": "Search Algorithms",
    "collision resolution": "Search Algorithms",
  },
  database: {
    "1nf": "Normalization",
    "2nf": "Normalization",
    "3nf": "Normalization",
    "bcnf": "Normalization",
    "4nf": "Normalization",
    "normal form": "Normalization",
    "decomposition": "Normalization",
    "functional depend": "Normalization",
    "multivalued depend": "Normalization",
    "clustered": "Indexing",
    "non-clustered": "Indexing",
    "composite index": "Indexing",
    "covering index": "Indexing",
    "deadlock": "Deadlock",
    "serializab": "Transactions/ACID",
    "lock-based": "Transactions/ACID",
    "two-phase": "Transactions/ACID",
    "timestamp-based": "Transactions/ACID",
    "isolation level": "Transactions/ACID",
    "2pl": "Transactions/ACID",
    "aries": "WAL Protocol",
    "checkpoint": "WAL Protocol",
    "replication": "Distributed Databases",
    "partitioning": "Distributed Databases",
    "sharding": "Distributed Databases",
    "cap theorem": "Distributed Databases",
    "two-phase commit": "Distributed Databases",
    "2pc": "Distributed Databases",
    "nosql": "Distributed Databases",
    "cost estimation": "Relational Algebra",
    "query execution": "Relational Algebra",
    "join algorithm": "JOIN Operations",
    "nested loop": "JOIN Operations",
    "sort-merge": "JOIN Operations",
    "hash join": "JOIN Operations",
    "weak entity": "ER Modeling",
    "generalization": "ER Modeling",
    "specialization": "ER Modeling",
    "eer": "ER Modeling",
    "olap": "Views & Materialized Views",
    "star schema": "Views & Materialized Views",
    "trigger": "Views & Materialized Views",
    "stored procedure": "Views & Materialized Views",
    "sql injection": "Relational Algebra",
    "union vs union all": "Subqueries",
    "set operations": "Subqueries",
    "connection pool": "Distributed Databases",
    "division operation": "Relational Algebra",
    "equivalences": "Relational Algebra",
    "aggregation": "SQL Basics",
    "group by": "SQL Basics",
    "having": "SQL Basics",
    "window function": "SQL Basics",
    "over": "SQL Basics",
    "partition by": "SQL Basics",
    "row_number": "SQL Basics",
    "hash index": "Indexing",
    "extendible hashing": "Indexing",
    "referential integrity": "ER Modeling",
    "foreign key action": "ER Modeling",
    "cost-based": "Relational Algebra",
    "rule-based": "Relational Algebra",
    "optimization": "Relational Algebra",
  },
  computerSecurity: {
    "symmetric encryption": "Symmetric/Asymmetric Encryption",
    "aes": "Symmetric/Asymmetric Encryption",
    "des": "Symmetric/Asymmetric Encryption",
    "ecb": "Symmetric/Asymmetric Encryption",
    "cbc": "Symmetric/Asymmetric Encryption",
    "stream cipher": "Symmetric/Asymmetric Encryption",
    "asymmetric encryption": "Symmetric/Asymmetric Encryption",
    "rsa": "Symmetric/Asymmetric Encryption",
    "ecc": "Symmetric/Asymmetric Encryption",
    "hybrid encryption": "Symmetric/Asymmetric Encryption",
    "digital signature": "PKI/Certificates",
    "mac": "Hash Functions",
    "cryptographic hash": "Hash Functions",
    "sha-256": "Hash Functions",
    "md5": "Hash Functions",
    "birthday attack": "Hash Functions",
    "password hash": "Hash Functions",
    "salting": "Hash Functions",
    "tls": "Network Security",
    "ssl": "Network Security",
    "firewall": "Firewalls",
    "packet filtering": "Firewalls",
    "intrusion detection": "Network Security",
    "ids": "Network Security",
    "ips": "Network Security",
    "dns security": "Network Security",
    "dnssec": "Network Security",
    "session management": "CSRF",
    "csp": "Cross-Site Scripting (XSS)",
    "content security policy": "Cross-Site Scripting (XSS)",
    "mfa": "Authentication/Authorization",
    "multi-factor": "Authentication/Authorization",
    "rbac": "Authentication/Authorization",
    "role-based": "Authentication/Authorization",
    "oauth": "OAuth/JWT",
    "delegated authorization": "OAuth/JWT",
    "memory safety": "Buffer Overflow",
    "aslr": "Buffer Overflow",
    "race condition": "Side-Channel Attacks",
    "toctou": "Side-Channel Attacks",
    "privilege escalation": "Authentication/Authorization",
    "sandboxing": "Authentication/Authorization",
    "selinux": "Authentication/Authorization",
    "apparmor": "Authentication/Authorization",
    "least privilege": "Authentication/Authorization",
    "defense in depth": "Network Security",
    "threat modeling": "Network Security",
    "stride": "Network Security",
    "malware": "Network Security",
    "phishing": "Network Security",
    "social engineering": "Network Security",
    "input validation": "Cross-Site Scripting (XSS)",
    "sanitization": "Cross-Site Scripting (XSS)",
  },
  dataStructure: {
    "dynamic array": "Arrays",
    "arraylist": "Arrays",
    "vector": "Arrays",
    "skip list": "Linked Lists",
    "singly": "Linked Lists",
    "doubly linked": "Linked Lists",
    "circular queue": "Queues/Deques",
    "deque": "Queues/Deques",
    "priority queue": "Heaps/Priority Queues",
    "bst": "Binary Trees",
    "binary search tree": "Binary Trees",
    "binary tree traversal": "Binary Trees",
    "avl": "AVL/Red-Black Trees",
    "red-black": "AVL/Red-Black Trees",
    "splay tree": "Binary Trees",
    "bloom filter": "Hash Tables",
    "lru cache": "Hash Tables",
    "rehashing": "Hash Tables",
    "resizing": "Hash Tables",
    "adjacency matrix": "Graphs",
    "adjacency list": "Graphs",
    "graph traversal": "Graphs",
    "graph representation": "Graphs",
    "fenwick": "Segment Trees",
    "bit": "Segment Trees",
    "adt": "Arrays",
    "amortized": "Arrays",
    "time-space tradeoff": "Arrays",
    "heap": "Heaps/Priority Queues",
    "min-heap": "Heaps/Priority Queues",
    "max-heap": "Heaps/Priority Queues",
    "b-tree": "Binary Trees",
    "b+ tree": "Binary Trees",
    "trie": "Tries",
    "prefix tree": "Tries",
    "comparison of sorting": "Arrays",
    "minimum spanning tree": "Graphs",
    "shortest path": "Graphs",
  },
  operatingSystem: {
    "process vs thread": "Process Management",
    "process state": "Process Management",
    "pcb": "Process Management",
    "zombie": "Process Management",
    "orphan": "Process Management",
    "context switch": "Process Management",
    "signal handling": "Process Management",
    "fcfs": "CPU Scheduling",
    "sjf": "CPU Scheduling",
    "round robin": "CPU Scheduling",
    "mlfq": "CPU Scheduling",
    "multi-level feedback": "CPU Scheduling",
    "preemptive": "CPU Scheduling",
    "non-preemptive": "CPU Scheduling",
    "rate monotonic": "CPU Scheduling",
    "edf": "CPU Scheduling",
    "real-time scheduling": "CPU Scheduling",
    "critical section": "Synchronization/Mutex",
    "race condition": "Synchronization/Mutex",
    "semaphore": "Synchronization/Mutex",
    "spinlock": "Synchronization/Mutex",
    "mutex": "Synchronization/Mutex",
    "monitor": "Synchronization/Mutex",
    "condition variable": "Synchronization/Mutex",
    "priority inversion": "Synchronization/Mutex",
    "priority inheritance": "Synchronization/Mutex",
    "classic synchronization": "Synchronization/Mutex",
    "contiguous allocation": "Memory Management",
    "fragmentation": "Memory Management",
    "buddy system": "Memory Management",
    "slab allocation": "Memory Management",
    "memory protection": "Memory Management",
    "mmu": "Memory Management",
    "tlb": "Virtual Memory",
    "demand paging": "Virtual Memory",
    "page fault": "Virtual Memory",
    "inverted page table": "Virtual Memory",
    "paging": "Virtual Memory",
    "segmentation": "Virtual Memory",
    "working set": "Page Replacement",
    "thrashing": "Page Replacement",
    "lru approximation": "Page Replacement",
    "raid": "File Systems",
    "file allocation": "File Systems",
    "journaling": "File Systems",
    "log-structured": "File Systems",
    "disk scheduling": "Inode/Disk Management",
    "free space management": "Inode/Disk Management",
    "directory structure": "File Systems",
    "user mode": "Kernel Architecture",
    "kernel mode": "Kernel Architecture",
    "system call": "Kernel Architecture",
    "virtualization": "Kernel Architecture",
    "container": "Kernel Architecture",
    "monolithic": "Kernel Architecture",
    "microkernel": "Kernel Architecture",
    "access control": "Kernel Architecture",
    "acl": "Kernel Architecture",
    "capability": "Kernel Architecture",
    "polling": "Interrupt Handling",
    "dma": "Interrupt Handling",
    "i/o method": "Interrupt Handling",
    "deadlock": "Synchronization/Mutex",
    "starvation": "Synchronization/Mutex",
    "user-level thread": "Threads",
    "kernel-level thread": "Threads",
    "memory-mapped": "Inter-Process Communication",
    "shared memory": "Inter-Process Communication",
  },
  computerArchitecture: {
    "risc": "RISC vs CISC",
    "cisc": "RISC vs CISC",
    "addressing mode": "Instruction Set (ISA)",
    "instruction format": "Instruction Set (ISA)",
    "instruction encoding": "Instruction Set (ISA)",
    "procedure calling": "Instruction Set (ISA)",
    "stack frame": "Instruction Set (ISA)",
    "single-cycle": "CPU Pipeline",
    "multi-cycle": "CPU Pipeline",
    "pipeline stage": "CPU Pipeline",
    "throughput": "CPU Pipeline",
    "data hazard": "CPU Pipeline",
    "forwarding": "CPU Pipeline",
    "structural hazard": "CPU Pipeline",
    "control hazard": "Branch Prediction",
    "cache basics": "Cache Memory",
    "cache mapping": "Cache Memory",
    "direct-mapped": "Cache Memory",
    "set-associative": "Cache Memory",
    "fully associative": "Cache Memory",
    "cache replacement": "Cache Memory",
    "write policies": "Cache Memory",
    "multi-level cache": "Cache Memory",
    "l1": "Cache Memory",
    "l2": "Cache Memory",
    "cache coherence": "Cache Memory",
    "mesi": "Cache Memory",
    "snooping": "Cache Memory",
    "virtual memory": "Memory Hierarchy",
    "page table": "Memory Hierarchy",
    "ieee 754": "Floating Point Arithmetic",
    "out-of-order": "Parallel Processing",
    "tomasulo": "Parallel Processing",
    "superscalar": "Parallel Processing",
    "vliw": "Parallel Processing",
    "speculative execution": "Parallel Processing",
    "reorder buffer": "Parallel Processing",
    "flynn": "Parallel Processing",
    "simd": "Parallel Processing",
    "mimd": "Parallel Processing",
    "gpu": "Parallel Processing",
    "simt": "Parallel Processing",
    "amdahl": "Parallel Processing",
    "bus architecture": "Bus Architecture",
    "interconnect": "Bus Architecture",
    "dram": "Memory Hierarchy",
    "memory technology": "Memory Hierarchy",
    "alu": "Instruction Set (ISA)",
    "arithmetic circuit": "Instruction Set (ISA)",
    "integer representation": "Floating Point Arithmetic",
    "two's complement": "Floating Point Arithmetic",
    "multiplication": "Floating Point Arithmetic",
    "division": "Floating Point Arithmetic",
    "power consumption": "Interrupts",
    "energy efficiency": "Interrupts",
  },
  computerNetworking: {
    "osi": "OSI 7 Layers",
    "tcp/ip model": "TCP/IP",
    "circuit switching": "TCP/IP",
    "packet switching": "TCP/IP",
    "end-to-end delay": "TCP/IP",
    "http/1": "HTTP/HTTPS",
    "http/2": "HTTP/HTTPS",
    "http/3": "HTTP/HTTPS",
    "quic": "HTTP/HTTPS",
    "multiplexing": "HTTP/HTTPS",
    "3-way handshake": "TCP/IP",
    "tcp reliable": "TCP/IP",
    "arq": "TCP/IP",
    "tcp congestion": "TCP/IP",
    "aimd": "TCP/IP",
    "slow start": "TCP/IP",
    "fast recovery": "TCP/IP",
    "fast retransmit": "TCP/IP",
    "selective repeat": "TCP/IP",
    "tcp flow control": "TCP/IP",
    "zero window": "TCP/IP",
    "time_wait": "TCP/IP",
    "tcp reno": "TCP/IP",
    "tcp tahoe": "TCP/IP",
    "go-back-n": "TCP/IP",
    "ipv4": "TCP/IP",
    "subnetting": "TCP/IP",
    "cidr": "TCP/IP",
    "ipv6": "TCP/IP",
    "ip fragment": "TCP/IP",
    "icmp": "ARP/ICMP",
    "traceroute": "ARP/ICMP",
    "arp": "ARP/ICMP",
    "dhcp": "TCP/IP",
    "email protocol": "TCP/IP",
    "smtp": "TCP/IP",
    "imap": "TCP/IP",
    "link-state": "Routing Protocols",
    "ospf": "Routing Protocols",
    "bgp": "Routing Protocols",
    "distance vector": "Routing Protocols",
    "count-to-infinity": "Routing Protocols",
    "ethernet": "TCP/IP",
    "csma/cd": "TCP/IP",
    "wifi": "TCP/IP",
    "802.11": "TCP/IP",
    "csma/ca": "TCP/IP",
    "tls 1.3": "TLS/SSL",
    "0-rtt": "TLS/SSL",
    "dnssec": "DNS",
    "cdn": "DNS",
    "dns redirection": "DNS",
    "vlan": "NAT",
    "inter-vlan": "NAT",
    "stp": "NAT",
    "broadcast storm": "NAT",
    "sdn": "Load Balancing",
    "openflow": "Load Balancing",
    "crc": "TCP/IP",
    "switch self-learning": "TCP/IP",
    "flooding": "TCP/IP",
    "igmp": "UDP",
    "multicast": "UDP",
    "ddos": "TCP/IP",
    "arp spoofing": "ARP/ICMP",
    "dns poisoning": "DNS",
    "network attack": "TCP/IP",
  },
  softwareEngineering: {
    "waterfall": "Agile/Scrum",
    "iterative": "Agile/Scrum",
    "incremental": "Agile/Scrum",
    "spiral": "Agile/Scrum",
    "rup": "Agile/Scrum",
    "devops": "CI/CD",
    "project management": "Agile/Scrum",
    "estimation": "Agile/Scrum",
    "functional requirement": "Requirements Engineering",
    "non-functional": "Requirements Engineering",
    "use case diagram": "UML",
    "user stories": "Requirements Engineering",
    "elicitation": "Requirements Engineering",
    "validation": "Requirements Engineering",
    "coupling": "SOLID Principles",
    "cohesion": "SOLID Principles",
    "monolithic": "Architecture Patterns",
    "microservice": "Architecture Patterns",
    "api design": "Architecture Patterns",
    "rest": "Architecture Patterns",
    "graphql": "Architecture Patterns",
    "cloud": "Architecture Patterns",
    "serverless": "Architecture Patterns",
    "mvc": "Architecture Patterns",
    "mvvm": "Architecture Patterns",
    "testing level": "Test-Driven Development",
    "white-box": "Test-Driven Development",
    "black-box": "Test-Driven Development",
    "unit": "Test-Driven Development",
    "integration": "Test-Driven Development",
    "class diagram": "UML",
    "sequence diagram": "UML",
    "state diagram": "UML",
    "activity diagram": "UML",
    "component diagram": "UML",
    "iso 25010": "Code Review",
    "code metric": "Code Review",
    "technical debt": "Code Review",
    "static analysis": "Code Review",
    "effort estimation": "Agile/Scrum",
    "cocomo": "Agile/Scrum",
    "story points": "Agile/Scrum",
    "function point": "Agile/Scrum",
    "risk management": "Agile/Scrum",
    "cmmi": "Agile/Scrum",
    "iso": "Agile/Scrum",
    "maintenance": "Refactoring",
    "lehman": "Refactoring",
    "git branching": "CI/CD",
    "scm": "CI/CD",
    "configuration management": "CI/CD",
  },
  springBoot: {
    "ioc": "IoC/DI",
    "dependency injection": "IoC/DI",
    "component scanning": "Auto Configuration",
    "configuration": "Auto Configuration",
    "embedded server": "Auto Configuration",
    "fat jar": "Auto Configuration",
    "externalized": "Profiles",
    "dispatcherservlet": "Spring MVC",
    "request mapping": "Spring MVC",
    "parameter binding": "Spring MVC",
    "exception handling": "Spring MVC",
    "response structure": "Spring MVC",
    "responseentity": "Spring MVC",
    "content negotiation": "Spring MVC",
    "entity mapping": "Spring Data JPA",
    "relationship": "Spring Data JPA",
    "n+1": "Spring Data JPA",
    "fetch strateg": "Spring Data JPA",
    "repository": "Spring Data JPA",
    "query method": "Spring Data JPA",
    "persistence context": "Spring Data JPA",
    "hikaricp": "Spring Data JPA",
    "datasource": "Spring Data JPA",
    "auditing": "Spring Data JPA",
    "baseentity": "Spring Data JPA",
    "connection pool": "Spring Data JPA",
    "@transactional": "Transaction Management",
    "propagation": "Transaction Management",
    "rollback": "Transaction Management",
    "aop": "AOP",
    "proxy mechanism": "AOP",
    "authentication": "Spring Security",
    "authorization": "Spring Security",
    "jwt": "Spring Security",
    "mockito": "Testing Strategies",
    "unit testing": "Testing Strategies",
    "@springboottest": "Testing Strategies",
    "@datajpatest": "Testing Strategies",
    "@webmvctest": "Testing Strategies",
  },
};

// Generic CS words that shouldn't drive matches on their own
const STOP_WORDS = new Set([
  "algorithm", "algorithms", "analysis", "based", "data",
  "design", "model", "method", "methods", "problem",
  "problems", "structure", "structures", "system", "systems",
  "type", "types", "operations", "operation", "management",
]);

function tokenMatch(a: string, b: string): boolean {
  if (a === b) return true;
  return stem(a) === stem(b);
}

/**
 * 생성된 concept 문자열을 해당 토픽의 시드 concept에 매칭
 * @returns 매칭된 SeedConcept 또는 null
 */
export function matchConcept(
  generatedConcept: string,
  topicId: string
): SeedConcept | null {
  const seedConcepts = conceptCache.get(topicId);
  if (!seedConcepts || seedConcepts.length === 0) return null;

  const genLower = generatedConcept.toLowerCase();

  // 1. Exact match (case-insensitive)
  for (const seed of seedConcepts) {
    if (seed.name_en.toLowerCase() === genLower) return seed;
  }

  // 2. Seed name contained in generated concept (multi-word seeds only)
  //    e.g., "SQL Injection" in "SQL Injection Attacks"
  //    e.g., "Dynamic Programming" in "DP Principles: Optimal Substructure..."
  for (const seed of seedConcepts) {
    const seedLower = seed.name_en.toLowerCase();
    if (seedLower.length >= 4 && genLower.includes(seedLower)) return seed;
  }

  // 3. Generated concept contained in seed name (short gen strings)
  //    e.g., "CSRF" generated matches "CSRF" seed
  for (const seed of seedConcepts) {
    const seedLower = seed.name_en.toLowerCase();
    if (genLower.length >= 3 && seedLower.includes(genLower)) return seed;
  }

  // 4. Keyword alias table lookup
  const aliases = KEYWORD_ALIASES[topicId];
  if (aliases) {
    for (const [keyword, seedName] of Object.entries(aliases)) {
      if (genLower.includes(keyword)) {
        const found = seedConcepts.find(
          (s) => s.name_en.toLowerCase() === seedName.toLowerCase()
        );
        if (found) return found;
      }
    }
  }

  // 5. Keyword overlap scoring (exact + plural only, no substring)
  const genTokens = tokenize(generatedConcept);
  let bestSeed: SeedConcept | null = null;
  let bestScore = 0;

  for (const seed of seedConcepts) {
    const seedTokens = tokenize(seed.name_en);
    if (seedTokens.length === 0) continue;

    let matchCount = 0;
    let meaningfulMatch = false;

    for (const st of seedTokens) {
      for (const gt of genTokens) {
        if (tokenMatch(gt, st)) {
          matchCount++;
          if (!STOP_WORDS.has(st)) meaningfulMatch = true;
          break;
        }
      }
    }

    // Score: fraction of seed tokens matched
    const score = matchCount / seedTokens.length;
    // Require at least one non-stop-word match
    if (score > bestScore && meaningfulMatch) {
      bestScore = score;
      bestSeed = seed;
    }
  }

  // Require at least 50% seed token coverage with a meaningful match
  if (bestScore >= 0.5 && bestSeed) return bestSeed;

  return null;
}

export function getConceptCache(): Map<string, SeedConcept[]> {
  return conceptCache;
}
