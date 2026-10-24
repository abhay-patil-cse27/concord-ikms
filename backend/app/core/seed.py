from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.logging import logger
from app.core.security import get_password_hash
from app.modules.organizations.models import Department, Membership
from app.modules.identity.models import User, Role, Permission, UserRole, RolePermission


DEFAULT_DEPARTMENTS = [
    {"code": "ADMIN", "name": "Central Administration", "description": "Institutional governance and college administration"},
    {"code": "CSE", "name": "Computer Science & Engineering", "description": "Academic Department of CSE"},
    {"code": "TPO", "name": "Training & Placement Office", "description": "Career guidance, recruitment, and internship governance"},
    {"code": "EXAM", "name": "Examinations & Evaluation Cell", "description": "Academic evaluations and grading policies"},
]

DEFAULT_PERMISSIONS = [
    # System
    {"code": "system:admin", "description": "Full institutional administrative oversight", "module": "system"},
    # Users & Auth
    {"code": "users:read", "description": "View institutional user directories", "module": "identity"},
    {"code": "users:write", "description": "Manage user accounts and role assignments", "module": "identity"},
    # Departments
    {"code": "departments:read", "description": "View institutional departments", "module": "organizations"},
    {"code": "departments:write", "description": "Create and manage departments", "module": "organizations"},
    # Documents
    {"code": "documents:read", "description": "Search and view institutional documents", "module": "documents"},
    {"code": "documents:write", "description": "Upload and manage department documents", "module": "documents"},
    {"code": "documents:delete", "description": "Archive or delete documents", "module": "documents"},
    # Search
    {"code": "search:query", "description": "Query institutional knowledge base", "module": "search"},
    # Audit
    {"code": "audit:read", "description": "Inspect security audit logs", "module": "audit"},
]

DEFAULT_ROLES = [
    {
        "code": "platform_admin",
        "name": "Platform Administrator",
        "description": "Full administrative access across all institutional modules",
        "is_system": True,
        "permissions": ["system:admin", "users:read", "users:write", "departments:read", "departments:write", "documents:read", "documents:write", "documents:delete", "search:query", "audit:read"],
    },
    {
        "code": "dept_admin",
        "name": "Department Administrator",
        "description": "Administrative control scoped to specific department resources",
        "is_system": True,
        "permissions": ["users:read", "departments:read", "documents:read", "documents:write", "search:query", "audit:read"],
    },
    {
        "code": "faculty",
        "name": "Faculty Member",
        "description": "Academic staff with document ingestion and search capabilities",
        "is_system": True,
        "permissions": ["departments:read", "documents:read", "documents:write", "search:query"],
    },
    {
        "code": "student",
        "name": "Student",
        "description": "Enrolled student with read-only search and Q&A access",
        "is_system": True,
        "permissions": ["departments:read", "documents:read", "search:query"],
    },
]

DEMO_USERS = [
    {
        "email": "admin@concord.kit.edu",
        "full_name": "Dr. A. Sharma (Platform Admin)",
        "password": "Admin@12345",
        "dept_code": "ADMIN",
        "roles": ["platform_admin"],
    },
    {
        "email": "deptadmin.cse@concord.kit.edu",
        "full_name": "Prof. S. Patil (HOD CSE)",
        "password": "Dept@12345",
        "dept_code": "CSE",
        "roles": ["dept_admin"],
    },
    {
        "email": "faculty.cse@concord.kit.edu",
        "full_name": "Prof. R. Deshmukh (CSE Faculty)",
        "password": "Faculty@12345",
        "dept_code": "CSE",
        "roles": ["faculty"],
    },
    {
        "email": "student.cse@concord.kit.edu",
        "full_name": "Aditya Kulkarni (Student)",
        "password": "Student@12345",
        "dept_code": "CSE",
        "roles": ["student"],
    },
]


async def seed_database(db: AsyncSession) -> None:
    """Seeds initial departments, permissions, roles, and demo users."""
    logger.info("Checking and seeding database initial state...")

    # 1. Seed Departments
    dept_map = {}
    for d_data in DEFAULT_DEPARTMENTS:
        res = await db.execute(select(Department).where(Department.code == d_data["code"]))
        dept = res.scalar_one_or_none()
        if not dept:
            dept = Department(code=d_data["code"], name=d_data["name"], description=d_data["description"])
            db.add(dept)
            await db.flush()
        dept_map[d_data["code"]] = dept

    # 2. Seed Permissions
    perm_map = {}
    for p_data in DEFAULT_PERMISSIONS:
        res = await db.execute(select(Permission).where(Permission.code == p_data["code"]))
        perm = res.scalar_one_or_none()
        if not perm:
            perm = Permission(code=p_data["code"], description=p_data["description"], module=p_data["module"])
            db.add(perm)
            await db.flush()
        perm_map[p_data["code"]] = perm

    # 3. Seed Roles & RolePermissions
    role_map = {}
    for r_data in DEFAULT_ROLES:
        res = await db.execute(select(Role).where(Role.code == r_data["code"]))
        role = res.scalar_one_or_none()
        if not role:
            role = Role(code=r_data["code"], name=r_data["name"], description=r_data["description"], is_system=r_data["is_system"])
            db.add(role)
            await db.flush()

            # Attach permissions
            for p_code in r_data["permissions"]:
                perm_obj = perm_map.get(p_code)
                if perm_obj:
                    rp = RolePermission(role_id=role.id, permission_id=perm_obj.id)
                    db.add(rp)
        role_map[r_data["code"]] = role

    # 4. Seed Demo Users
    for u_data in DEMO_USERS:
        res = await db.execute(select(User).where(User.email == u_data["email"]))
        user = res.scalar_one_or_none()
        dept = dept_map.get(u_data["dept_code"])
        if not user:
            user = User(
                email=u_data["email"],
                full_name=u_data["full_name"],
                hashed_password=get_password_hash(u_data["password"]),
                primary_department_id=dept.id if dept else None,
                is_active=True,
                is_verified=True,
            )
            db.add(user)
            await db.flush()

            # Assign roles
            for r_code in u_data["roles"]:
                role_obj = role_map.get(r_code)
                if role_obj:
                    ur = UserRole(user_id=user.id, role_id=role_obj.id)
                    db.add(ur)

            # Assign department membership
            if dept:
                membership = Membership(
                    user_id=user.id,
                    department_id=dept.id,
                    role_in_department=u_data["roles"][0]
                )
                db.add(membership)

    await db.commit()
    logger.info("Database base seeding completed successfully.")

    # 5. Seed Institutional Demo Documents
    from app.modules.documents.models import Document, DocumentChunk
    import hashlib
    import uuid

    demo_docs = [
        {
            "filename": "KIT_Autonomous_Academic_Regulations_2024.pdf",
            "title": "Autonomous Academic & Examination Regulations (2024 Curriculum)",
            "dept_code": "EXAM",
            "mime_type": "application/pdf",
            "lifecycle_status": "active",
            "version": "v2.0",
            "content": "KOLHAPUR INSTITUTE OF TECHNOLOGY (AUTONOMOUS)\nACADEMIC REGULATIONS AND EVALUATION RULES (2024 BATCH ONWARDS)\n\nATTENDANCE & ELIGIBILITY:\nEvery registered student must maintain a minimum attendance of 75% in theory courses and 80% in laboratory practical courses. Condonation up to 10% may be granted on medical grounds.\n\nPASSING STANDARDS & EVALUATION:\nA student must secure at least 40% in ESE (minimum 24 out of 60) and 40% overall (CIE + ESE, minimum 40 out of 100) to pass a course.\n\nATKT & PROMOTION CRITERIA:\nA student can carry a maximum of 4 backlogs into the next academic year. Minimum CGPA of 5.0 is mandatory for the award of B.Tech Degree.",
        },
        {
            "filename": "KIT_Academic_Regulations_2020_Superseded.pdf",
            "title": "Autonomous Academic Regulations (2020 Curriculum - Superseded)",
            "dept_code": "EXAM",
            "mime_type": "application/pdf",
            "lifecycle_status": "superseded",
            "version": "v1.0",
            "content": "KOLHAPUR INSTITUTE OF TECHNOLOGY (AUTONOMOUS)\nHISTORICAL ACADEMIC REGULATIONS (2020-2023) [SUPERSEDED]\n\nATTENDANCE RULES:\nMinimum attendance requirement was 70% with 15% discretionary medical allowance.\n\nPASSING STANDARDS:\nPassing standard required minimum 35% in End Semester Examination (21 out of 60) and 35% in aggregate. This policy is strictly superseded by Academic Regulations 2024.",
        },
        {
            "filename": "BTech_CSE_Autonomous_Curriculum_2024_28.pdf",
            "title": "B.Tech Computer Science & Engineering Structure & Syllabus (2024-2028)",
            "dept_code": "CSE",
            "mime_type": "application/pdf",
            "lifecycle_status": "active",
            "version": "v1.0",
            "content": "DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING\nFOUR-YEAR B.TECH DEGREE PROGRAMME STRUCTURE (2024-2028)\n\nSEMESTER 5 (THIRD YEAR CSE):\n1. CS301: Advanced Data Structures & Algorithms (Credits: 4, L-T-P: 3-0-2)\nCovers graph algorithms, randomized algorithms, B-Trees, Fibonacci heaps, and amortized complexity.\n2. CS302: Database Management Systems & NoSQL (Credits: 4, L-T-P: 3-0-2)\nRelational algebra, ACID transaction management, indexing, distributed MongoDB, and vector databases.\n3. CS303: Artificial Intelligence & Cognitive Systems (Credits: 3, L-T-P: 3-0-0)\nSearch techniques, probabilistic reasoning, knowledge representation, neural networks, and RAG architectures.\n\nTOTAL CREDITS REQUIRED FOR B.TECH DEGREE: 160 Credits across 8 Semesters.",
        },
    ]

    # Fetch admin user ID
    res_admin = await db.execute(select(User).where(User.email == "admin@concord.kit.edu"))
    admin_u = res_admin.scalar_one_or_none()

    for d_meta in demo_docs:
        res_existing = await db.execute(select(Document).where(Document.filename == d_meta["filename"]))
        if not res_existing.scalar_one_or_none():
            dept = dept_map.get(d_meta["dept_code"])
            text_bytes = d_meta["content"].encode("utf-8")
            doc = Document(
                id=str(uuid.uuid4()),
                title=d_meta["title"],
                filename=d_meta["filename"],
                file_path=f"demo/{d_meta['filename']}",
                file_size_bytes=len(text_bytes),
                mime_type=d_meta["mime_type"],
                sha256_hash=hashlib.sha256(text_bytes).hexdigest(),
                department_id=dept.id if dept else None,
                uploader_id=admin_u.id if admin_u else None,
                owner_id=admin_u.id if admin_u else None,
                visibility="department",
                status="processed",
                lifecycle_status=d_meta["lifecycle_status"],
                version=d_meta["version"],
                approval_status="approved",
                chunk_count=0,
            )
            db.add(doc)
            await db.flush()

            paragraphs = [p.strip() for p in d_meta["content"].split("\n\n") if p.strip()]
            for idx, p_text in enumerate(paragraphs):
                chunk = DocumentChunk(
                    id=str(uuid.uuid4()),
                    document_id=doc.id,
                    chunk_index=idx,
                    content=p_text,
                    char_count=len(p_text),
                    metadata_={"heading": d_meta["title"], "page_number": 1},
                )
                db.add(chunk)
            doc.chunk_count = len(paragraphs)
            await db.flush()

    await db.commit()
    logger.info("Database seeding completed with institutional demo documents.")
