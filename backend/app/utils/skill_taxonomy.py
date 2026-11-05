"""
Curated, high-quality, and extensible Skill Taxonomy for CareerPath.
Categorized into 9 standard technical and professional domains.
Supports synonym mapping, normalization, and category hierarchy.
"""

from typing import Dict, List, Set

SKILL_TAXONOMY: Dict[str, Dict[str, List[str]]] = {
    "Programming Languages": {
        "Python": ["python", "python3", "py"],
        "JavaScript": ["javascript", "js", "ecmascript"],
        "TypeScript": ["typescript", "ts"],
        "Java": ["java", "core java", "j2se", "j2ee"],
        "C++": ["c++", "cpp"],
        "C": ["c programming", "c language"],
        "C#": ["c#", "csharp", "c sharp"],
        "Go": ["golang", "go language"],
        "Rust": ["rust", "rustlang"],
        "PHP": ["php"],
        "Ruby": ["ruby", "ruby on rails"],
        "Kotlin": ["kotlin"],
        "Swift": ["swift"],
        "R": ["r programming", "r language"],
        "Scala": ["scala"],
        "Dart": ["dart"],
        "SQL": ["sql", "structured query language", "pl/sql", "t-sql"],
        "Shell/Bash": ["bash", "shell scripting", "zsh", "powershell", "sh"],
    },
    "Frameworks & Libraries": {
        "React": ["react", "react.js", "reactjs"],
        "Next.js": ["next.js", "nextjs", "next"],
        "Node.js": ["node.js", "nodejs", "node"],
        "Express": ["express.js", "expressjs", "express"],
        "FastAPI": ["fastapi", "fast api"],
        "Django": ["django", "django rest framework", "drf"],
        "Flask": ["flask"],
        "Spring Boot": ["spring boot", "springboot", "spring framework", "spring"],
        "Vue.js": ["vue", "vue.js", "vuejs"],
        "Angular": ["angular", "angularjs", "angular 2+"],
        "ASP.NET": ["asp.net", "asp.net core", ".net core", ".net"],
        "Svelte": ["svelte", "sveltekit"],
        "Tailwind CSS": ["tailwind", "tailwindcss"],
        "Bootstrap": ["bootstrap", "bootstrap 5"],
        "Redux": ["redux", "redux toolkit", "rtk"],
        "GraphQL": ["graphql", "apollo graphql"],
        "NestJS": ["nestjs", "nest.js"],
        "Flutter": ["flutter"],
        "React Native": ["react native", "react-native"],
    },
    "Databases": {
        "PostgreSQL": ["postgresql", "postgres", "psql"],
        "MySQL": ["mysql"],
        "MongoDB": ["mongodb", "mongo"],
        "Redis": ["redis"],
        "SQLite": ["sqlite", "sqlite3"],
        "Oracle DB": ["oracle", "oracle database", "plsql"],
        "Microsoft SQL Server": ["sql server", "mssql"],
        "Cassandra": ["cassandra", "apache cassandra"],
        "DynamoDB": ["dynamodb", "aws dynamodb"],
        "Firebase": ["firebase", "firestore", "firebase realtime database"],
        "Elasticsearch": ["elasticsearch", "elastic search", "elk stack"],
        "Supabase": ["supabase"],
    },
    "Cloud & DevOps": {
        "Docker": ["docker", "dockerfile", "docker-compose"],
        "Kubernetes": ["kubernetes", "k8s"],
        "AWS": ["aws", "amazon web services", "ec2", "s3", "lambda", "rds", "iam"],
        "Google Cloud Platform": ["gcp", "google cloud", "google cloud platform", "bigquery", "gcs"],
        "Microsoft Azure": ["azure", "azure devops", "azure functions"],
        "CI/CD": ["ci/cd", "ci cd", "continuous integration", "continuous deployment", "github actions", "gitlab ci", "jenkins"],
        "Linux": ["linux", "ubuntu", "debian", "centos", "redhat", "unix"],
        "Terraform": ["terraform", "iac", "infrastructure as code"],
        "Nginx": ["nginx"],
        "Git": ["git", "github", "gitlab", "bitbucket", "version control"],
    },
    "AI & Machine Learning": {
        "Machine Learning": ["machine learning", "ml", "supervised learning", "unsupervised learning"],
        "Deep Learning": ["deep learning", "neural networks", "cnn", "rnn", "lstm"],
        "Natural Language Processing": ["nlp", "natural language processing", "text classification", "ner", "sentiment analysis"],
        "Computer Vision": ["computer vision", "opencv", "image processing", "object detection", "yolo"],
        "PyTorch": ["pytorch", "torch"],
        "TensorFlow": ["tensorflow", "tf", "keras"],
        "Scikit-Learn": ["scikit-learn", "sklearn"],
        "Hugging Face": ["hugging face", "transformers", "huggingface", "llm", "large language models"],
        "Pandas": ["pandas"],
        "NumPy": ["numpy"],
        "Generative AI": ["generative ai", "genai", "prompt engineering", "langchain", "llamaindex", "rag"],
    },
    "Data & Analytics": {
        "Data Analysis": ["data analysis", "exploratory data analysis", "eda"],
        "Data Visualization": ["data visualization", "matplotlib", "seaborn", "plotly", "tableau", "power bi"],
        "Data Engineering": ["data engineering", "etl", "data pipelines", "data warehouse"],
        "Apache Spark": ["spark", "apache spark", "pyspark"],
        "Apache Kafka": ["kafka", "apache kafka"],
        "Excel": ["ms excel", "excel", "spreadsheets", "advanced excel"],
    },
    "Web Technologies": {
        "HTML5": ["html", "html5"],
        "CSS3": ["css", "css3", "sass", "scss"],
        "REST API": ["rest", "rest api", "restful api", "restful apis", "web apis"],
        "WebSockets": ["websockets", "websocket", "socket.io"],
        "Microservices": ["microservices", "microservice architecture", "distributed systems"],
        "OAuth": ["oauth", "oauth2", "jwt", "json web tokens", "authentication", "authorization"],
    },
    "Tools & Platforms": {
        "Postman": ["postman", "insomnia", "api testing"],
        "VS Code": ["vs code", "vscode", "visual studio code"],
        "Jira": ["jira", "confluence", "trello", "agile", "scrum"],
        "Figma": ["figma", "ui/ux design", "wireframing", "prototyping"],
        "npm": ["npm", "yarn", "pnpm"],
        "Webpack/Vite": ["vite", "webpack", "babel"],
    },
    "Soft Skills": {
        "Problem Solving": ["problem solving", "analytical skills", "critical thinking", "troubleshooting"],
        "Communication": ["communication", "verbal communication", "written communication", "presentation skills"],
        "Teamwork": ["teamwork", "collaboration", "cross-functional", "team player"],
        "Leadership": ["leadership", "mentorship", "project management", "team lead"],
        "Time Management": ["time management", "prioritization", "multitasking"],
        "Adaptability": ["adaptability", "quick learner", "fast learner", "flexibility"],
    },
}

# Reverse lookup dictionary: lowercase alias -> (Standard Skill Name, Category)
SKILL_LOOKUP: Dict[str, Dict[str, str]] = {}

for category, skills in SKILL_TAXONOMY.items():
    for standard_name, aliases in skills.items():
        # Map the standard name in lowercase
        SKILL_LOOKUP[standard_name.lower()] = {
            "name": standard_name,
            "category": category,
        }
        # Map all aliases
        for alias in aliases:
            SKILL_LOOKUP[alias.lower()] = {
                "name": standard_name,
                "category": category,
            }


def get_standard_skill(query: str) -> Dict[str, str] | None:
    """Returns the standardized skill name and category if matched, else None."""
    cleaned = query.strip().lower()
    return SKILL_LOOKUP.get(cleaned)


def get_all_standard_skills() -> List[Dict[str, str]]:
    """Returns a list of all distinct standard skills with categories."""
    seen = set()
    result = []
    for category, skills in SKILL_TAXONOMY.items():
        for standard_name in skills.keys():
            if standard_name not in seen:
                seen.add(standard_name)
                result.append({"name": standard_name, "category": category})
    return result
