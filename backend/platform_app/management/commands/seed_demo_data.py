from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import User
from platform_app.models import Event, Opportunity, Program


class Command(BaseCommand):
    help = "Seed demo programs, events, opportunities, and mentor accounts."

    def handle(self, *args, **options):
        now = timezone.now()
        featured_programs = [
            {
                "title": "Full Stack Development",
                "slug": "full-stack-development",
                "description": (
                    "Master modern web development with mentorship from industry engineers."
                ),
                "category": "development",
                "delivery_mode": "online",
                "image_url": (
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuDNERVkkPUnTOav-O4ao2dHNGBWEtwai-F7KFvNdbzdYQUE2WYptO8FJdH01NqDvbylRllJVQvlE9OZwIBOBIJnS-CIiKcUn6nObOxjfTlLWEw2HwwINf6OuHhr9gRh_PAqLa8mpdROyGAif04B1yllkMd4DflkWidbpRYHZNnZ19ICZkqGYC2utOdos9qJWLSa82hNP7I-a9t898DeFB9YsYmuOjmSAx3l-KTAm5UhtenH1MfLU5wpBQhvq_X89md16wYBhbmp0A"
                ),
                "price": 999,
                "duration_weeks": 12,
                "outcomes": "React, Node.js, SQL Mastery, Career Certification",
                "mentor_name": "Alex Rivera",
                "mentor_image_url": (
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuARNaU4E4mgffd-YvIk4u0dS6zV7feQwSHeYuqVu97MjaSDMZp-bcbyRwwFag1iJBEaeuaxbuHBO0DzQmlFMI87cJY4vrWVY6q2bRn-iiFZa4VdUSjl1ErdP8XAD_dvB5DOloh5lH--CbQZ_ooDyazULUcYhGW2UF6eDob2X9f5qjPRI6sy1aDG2WcTObgps2EMxI_o4MNSLNIsKtdvxl8zf9URkjo2mS3oXaGSM-gyCZVUzzJMD9PGqSgNA4VadMjVoXl6csOZfQ"
                ),
            },
            {
                "title": "UX/UI Design Masterclass",
                "slug": "ux-ui-design-masterclass",
                "description": (
                    "Hands-on design mentorship covering research, prototyping, and portfolio work."
                ),
                "category": "design",
                "delivery_mode": "hybrid",
                "image_url": (
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuC1ICh3tJZDG0kWIEtcVbzLvT6U9sIcMEU8CaJFkupmpLUCeNRM14NpRtzRAB453jJTk3q9z01WM-Jb8MplNn9ezfay65SMBUGLLc21ZYZkPzWXDmGYYMbDm4x3EBWaMZDNY5xPyZMpj0Gjm_ndHcjfaUizJkWtUWDn0H8Xlur37wR-svVDWLyW9piKp1Zy2mA4WH4d2DqQPiZsiU30VuN8A56Td3UjKuwJUKyOYhJOQ3iPGODs1Z9OvlGbZnWh-GWIMXz1jLsbBA"
                ),
                "price": 599,
                "duration_weeks": 8,
                "outcomes": "Figma Expert, UX Research, Portfolio Development",
                "mentor_name": "Sarah Chen",
                "mentor_image_url": (
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuAOcYHkb0QlB1v8vb0F1cE3ukaNviQP0k-ibOZ0bs7PDoafIm6l1Gj5nI5dOboWCO3AHSgpItKjpLYVnhNbrF0DQecBCyM344EJjCJ5myqYxSuSvgkM2o9wbm9-L6bgYdmdgW_AATxQC-hgRBHG49qt9MUOdxWbLO8lIpS5D10kB3ggLBjkG4EUglbs2Qn69LGhMM4EmF-og6Rd25lngGt8S6sR1AanmI2vPhZk36ZUuYS1f9UzpN4BtxdUHJeZzP1cM9nKLbSURA"
                ),
            },
            {
                "title": "Data Science BootCamp",
                "slug": "data-science-bootcamp",
                "description": (
                    "Intensive data science training with real-world projects and mentor feedback."
                ),
                "category": "data_science",
                "delivery_mode": "online",
                "image_url": (
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuB6AAEqdS2M4J7hrFtNsmNlUQ5OjszttJpGhJ_UfBlqLilf3bphyFNaWOlomsVoWhwoTnRgIuFrXgXAuNjUJgy5QA3HIcpFNiQN5lTZCcNun8V-bvPuTBiiaodl-iGSSA2iYs8fj2FA0cg8e41fvmKSJh2DrRRvNbouvKnCOSMAybb2z_VmRc_AvZB7Oo6Wo2JMfkrNa0iLzR42HJSRd2XrlcZDFshn0hL84D-sJ3JS8fndLJZ33x8scraYpWrzcr-wh5YVJTiXrg"
                ),
                "price": 1299,
                "duration_weeks": 16,
                "outcomes": "Python, Machine Learning, Stats, Kaggle Portfolio",
                "mentor_name": "Dr. James Wilson",
                "mentor_image_url": (
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuBF4WHszD1jC8voK6SOWeEvLKGFn1PZ4OBXqy510TkDtK7agc1cqNczbzcdkIzhw8_p-h0kr2eottLFI3fUJIrhwfyP-Lk3xH3bsmLoYui6Vn2b1zBTBBnZpZ3oL0HQJHZkDX1fd7TOdkfp7T8xR0XgITZJwW6Z0kU49BvDp5_SVyPyYRFGOBby4b5ODkpBbhPZcpE3TKMCMbhUmTMxLalxQ8nbjOUAHNv_seG-t3GIrkpObkFcUzx25eck45sRaB23ipHVibQiGw"
                ),
            },
            {
                "title": "Digital Marketing Strategy",
                "slug": "digital-marketing-strategy",
                "description": (
                    "Learn SEO, paid media, and analytics with a growth marketing mentor."
                ),
                "category": "marketing",
                "delivery_mode": "online",
                "image_url": (
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuAlEtaue3MRwnfp5dDU0zJ-_XQyegRqfoPetaH-0I9UHxpq6jiQGR6tNDPKb-ZBGtZXqGs-8czOLXCxFRwnT5ZSS4w9_EMt4tpxPXBm1JH3AgMWjDaTDr-kBHSH6ddHIo7egBMluzedP8Bhpdiy8L25ae_JHtT6eFXa0NWOi_vOT-iO3UTAfPo98jFG_229oPpFrPNkSxaQT5Gkm4r-MQXUYiE_YjXUlFRP458OGDfCb_DQsxr4BZzOKF0JYA956PGni0BhEIdJgA"
                ),
                "price": 450,
                "duration_weeks": 6,
                "outcomes": "SEO, PPC Expert, Data Analytics Certification",
                "mentor_name": "Elena Rodriguez",
                "mentor_image_url": (
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuD4KBda87VI9_WXy-5m9JsEc54xMABcH0t22oMIHWE7BmkhR0uuLmOyFHgOJlurIGbcoLNftBVHLPjcrGV30FGASWT86Hupr2IlSSpMAmA2ajNroiVpXGdq_uoNVDYLDHTktqc8DKxlEn-XZys5x8Ewl-cLCOCjiKBC35TNSABGZi5ZKNZAGL2gj43wqEmbnelRskCYVJLUmygDNhSORLjJjq7nqAuvuVe2XAa_G5OSfftVYRX_i2WKrnUL9mHZAlBzHQTi9WdfmA"
                ),
            },
            {
                "title": "Product Management",
                "slug": "product-management",
                "description": (
                    "Build product strategy skills with a mentor from a top technology company."
                ),
                "category": "business",
                "delivery_mode": "hybrid",
                "image_url": (
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuCqRlHuVPtnnU-hGnOBEBpbDxX89pwZS3Wo2OxjFQlPiklh6R8mGPRz3b0K0-ZdGHMJVHHqB34rj0P8YAPEr43VtyDgGNEAQSDByMJR0WUgG49_QM8WK6x3gmJy6LXAkZ83W4Po2MEU8jHr9ABxB_rp7Me81jftvtpFen-ydgyxFHYYjSljZTEOxUP1v5TaHiXVFNjoxbWMB1pulTU1Z3Uab5aOQy_1xgJzPIpDQeP1TMx_KqQFirBA6Fvmre-cDSmvyJiQiJr3Jg"
                ),
                "price": 750,
                "duration_weeks": 10,
                "outcomes": "Agile Methodology, Roadmapping, Product Launch",
                "mentor_name": "Marcus Thorne",
                "mentor_image_url": (
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuCi5StrJ0Ob3W_k8j0maFbWBj7CPmqUMHbyxEfqA12QT3zqFcchd-cSy9hoT9a-OSH7ZQDu4osTndH7XNbWRXAsXmL02OCFuY5OHIUdLP84uz8oN_JMeKSAHMmOymyeFMSQXxKcQNpEvS3UlBPAkj5SohKxa7WxbXj1RkhHlJtycqkCar4RBCK_RDiezYA60a8QD-IXMXMRlQEWGCLedbAzUbwLWyDNhPU_RbtSAuzgcm-5iwMQufsFXWSQTqZByqys3FcPz7w0bw"
                ),
            },
            {
                "title": "iOS Development with Swift",
                "slug": "ios-development-swift",
                "description": (
                    "Ship your first iOS app with guided Swift and SwiftUI mentorship."
                ),
                "category": "development",
                "delivery_mode": "online",
                "image_url": (
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuCcH2G_8EVKLi_wK2AP7JA7BVGuvyWpUBuDOtmVRyej8G5mN-DypxhNFOc1GkRVZ_aDIVVvLSTsJR4L0dQoQ-ScMLn61aOyqkFo9SpUNlz24fsq8m7uOtS6rihEWAMVP_eN5eITJM9h6mkVLljuFzKHd2LJTtvLNxPINsGZb9AWeeFaatoEG5IEy8i94L5KA_T2bXe924W892RCBcQfOn8wBdzfKqOaKiPBEDWzGXw7cl2Bcus0kpDF_q-ef7CXdRFP2sgLEYDpyQ"
                ),
                "price": 899,
                "duration_weeks": 14,
                "outcomes": "Swift UI, Core Data, App Store Deployment",
                "mentor_name": "Julia Zhang",
                "mentor_image_url": (
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuBbwn_SxHrXIJXOOoT-9wz7Bxi6GFJk-kRbznIi1QMdBn-M2h4hGi6CsrcuS1Hv8e4DNTT8kdDCTF33nanEhiZ9t6qaSf8h8Z6NsBF_YLpt9_TDrpHuFeM4C1T8B45mZntHuK2g1Py0GsgBlqznoyqD1zNiqc_QJIjami7UpDWfoahugNB0vdKYQ7sTuqiwl-EGU4yCdNXeLDEAKR2SK4Z9k-4CG0gmcOn5oEammfVEJj7WQVDy5m6rAdGQ3V6eUf9FKn7_VKd0wA"
                ),
            },
        ]

        featured_slugs = [item["slug"] for item in featured_programs]
        Program.objects.exclude(slug__in=featured_slugs).delete()
        for item in featured_programs:
            Program.objects.update_or_create(slug=item["slug"], defaults=item)

        featured_events = [
            {
                "title": "UX Design Workshop",
                "category": "workshop",
                "description": (
                    "Learn the fundamentals of user-centered design and rapid prototyping "
                    "in this intensive hands-on weekend session."
                ),
                "image_url": (
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuDLvxRjHFT5atgnHPAa5Nfflhtjj20d5mDu2nbQDGXg5qarTVbzDjVYOV60kQc3I2aCFJKmsHbfajvZIXV5Eb4XlngtJRtzJpS_GaHgZOp2Z5ERjfDaYSlLAybgs_adQxuWsHbVf9gE0xhuzX7cwVL1KyhKU1gfj2cU312wworD26_SMaBHq8Pq2H22xRj_3M9GFjA23nyGhuJT0J1BqqwIG3Y-7RGVIq29qXl1ADALfG_S_fOZAjZEfKmPQN4_HFbO3By7_k-Vsa8h"
                ),
                "application_deadline": date(2026, 10, 24),
                "starts_at": now + timedelta(days=21, hours=10),
                "ends_at": now + timedelta(days=21, hours=17),
                "location": "Design Studio, Campus Center",
            },
            {
                "title": "Data Science Summit",
                "category": "seminar",
                "description": (
                    "Join industry leaders as they discuss the future of AI and big data "
                    "analytics in the evolving tech landscape."
                ),
                "image_url": (
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuCNMIBjwHD7uVsZ6UEsEEb7xXdDoSnV3UmputMNHrYjRtsd58yeMjgHpTSsvSzroJwEaWjFcvGlHmu5cHL6LE2TOIiariQnR6oICFmAZfEwsITGoqiKI4SdiTvrkLfU7KwyxmISOIBcKhlsN8lP7bPzDWpYVPXbYxZ-rH3yHFUl_m748b4br62M3JrjAWONdvWRZWEdLzvWImvsMqJ4PwUVhYKkS27EmsJGtnUshdPddvwv2mluPC9oaca5eM86_tV0i-Mvo-MyPWT0"
                ),
                "application_deadline": date(2026, 11, 2),
                "starts_at": now + timedelta(days=35, hours=9),
                "ends_at": now + timedelta(days=35, hours=17),
                "location": "Main Auditorium",
            },
            {
                "title": "Tech Founders Meetup",
                "category": "networking",
                "description": (
                    "Connect with fellow entrepreneurs and potential mentors in a casual "
                    "environment to share ideas and insights."
                ),
                "image_url": (
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuA9_eVESBv20DirssTllq-gjkN9AlJCIMjfSfJzHC9RCxPnBhQp3xSItCFZOtr-LGPc4flqvh3c4p6yQ-wuFhytBk0i5azFfa2YH886KRmhLkNAWmg_XO0cAfvqNG34Xx3B4GqhlV-DB-q55n9GMUtRUwjzc0CJuIcTaayNsNnQ4S930VmiW6MEmQmzZPAporSCHFowhtFL5y7AgUq_pX4-smDQNjQFm-ca6nRUvDM3ZxPiUDbvJBZwFCRBRoxkzeuVrmPiQkDl11Yj"
                ),
                "application_deadline": date(2026, 10, 28),
                "starts_at": now + timedelta(days=28, hours=18),
                "ends_at": now + timedelta(days=28, hours=21),
                "location": "Innovation Hub Lounge",
            },
            {
                "title": "Full-Stack Development",
                "category": "bootcamp",
                "description": (
                    "A 48-hour intensive coding sprint focused on modern frameworks like "
                    "React and Node.js for aspiring developers."
                ),
                "image_url": (
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuBqC3gYBOoNr-mnLG5gYXSRWQoUUQLvQAvk_klGCvW0Zuncj_ZUwtckDApioU7sJw03I9l-uegvdi_gFPiiNSCpn7Svuaw0w7VF6wXJte2_xkbKPCG9h0TmawrHuvSTBJdqqwQzOtaC7rmzDzeOU5ZRKvoLcC1QR-zl9OzFI9rLlO2Z0hI46Ewdx2g-9uMmbhHOQdJtRwuHCp-Dq7KYrEXsRQ3AadZzq78N99N34SeDrCxjZQ-Q7dPU1sX0vghS235QoMJPhHedmyXe"
                ),
                "application_deadline": date(2026, 11, 15),
                "starts_at": now + timedelta(days=42, hours=9),
                "ends_at": now + timedelta(days=44, hours=18),
                "location": "Computer Science Building",
            },
            {
                "title": "Career Transition Path",
                "category": "seminar",
                "description": (
                    "Experts share strategies for successfully switching careers into the "
                    "tech industry from non-technical backgrounds."
                ),
                "image_url": (
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuCTF_o3opOMgeuz9UhmCroudv-PBKHiOBZ7nEGBFAEz6KrQhx7QxU_tg7w8NQXQ_-ghevWX1Hrq5ukr3joV7eA7VAWbeKYi_x1u1x8Df_8wOltS6l56m2bv2nudXHbVspQnLAJpEwyW_6FFbw5nfl3oBbGL-lZp5-Z2EV69_ArHxGD42TQH86Irigx_t-f175uC_lI9012-3BY9IWYaz6ylyy9RQnCYL643adxlWuqzCJu5Q0K9hT31fEPWILCBb3QyXEpioQG70drJ"
                ),
                "application_deadline": date(2026, 10, 30),
                "starts_at": now + timedelta(days=32, hours=14),
                "ends_at": now + timedelta(days=32, hours=16),
                "location": "Career Services Hall",
            },
            {
                "title": "Mobile App Strategy",
                "category": "workshop",
                "description": (
                    "Defining the product roadmap and marketing strategy for launching a "
                    "successful mobile application in 2026."
                ),
                "image_url": (
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuDu8tC9o0GDd4f1-iXsKI9vrhBWkmEa9JV-r-jBw7zVsv0FMQnXKuloTAjgZrqv4lnLr-Gq8U68-HYnsTJKuyGxelHm8WuXU1QCvnZx1amoWxbwJjPQrrN3D2AHx3UW0jMuaLCGRMpv6Azp0yU7jPGxht7my25CwBcsO17r2SgE6rd697Kju8D6zxdUfhv1IYnkwKUs_BEBw7S1vGEHZuFAOGmPWTNT7E4Q6JYYIig9WD64yMTLHqk_tYEsmmwdDAPr43FZ1BeXpo60"
                ),
                "application_deadline": date(2026, 11, 12),
                "starts_at": now + timedelta(days=38, hours=11),
                "ends_at": now + timedelta(days=38, hours=15),
                "location": "Product Lab",
            },
        ]

        featured_titles = [item["title"] for item in featured_events]
        Event.objects.exclude(title__in=featured_titles).delete()
        for item in featured_events:
            Event.objects.update_or_create(title=item["title"], defaults=item)

        featured_opportunities = [
            {
                "title": "UX Design Intern",
                "category": "internship",
                "description": (
                    "Join our design team to build intuitive user interfaces for global "
                    "fintech solutions. Remote-friendly and mentored."
                ),
                "image_url": (
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuBjtC1SJUDPTQq-vhN9KFDbccoQACvd_gjIxNb9JR1Vw4jRMwc-sICQ4VbWLqRHZUh3DLBK_u6eBFINqu-RLBjtKVPIeB0Q3sDSDEgbJbwJ-lFPjorbNyvKqT6xXgXdk5meafUipsesRIU8aZ-nxUvUxerj_U9WWakBvTgh2ZKI_UMKjaWl9s2s58dv7B6YEPQfT3A7lpGdKC_ztfbBQD9vql1Fxb04E7lGnF7PnAFz_slxpAU86DpueSLd6bge0Lsj14tYlgHrbNI"
                ),
                "cta_label": "Apply Now",
                "deadline": date(2026, 10, 15),
                "is_ongoing": False,
            },
            {
                "title": "STEM Excellence Award",
                "category": "scholarship",
                "description": (
                    "Providing full tuition coverage for outstanding undergraduate students "
                    "pursuing degrees in Computer Science."
                ),
                "image_url": (
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuAsjjPBFAmwLI3Fb6SdAjRAVWJl0ACdXbl3hY-ePs3ufcPsQHCrurfvGJChfZTrh85uYNCEWT0JmOpR4Ao6MnfVwtnGL6mh1Dzq8cB8x9Nptg5Lq_fICMyrX4iQ3Zg-lIJM8GkPGqMXCKrz8qLsMG39WDwnYYUPQ48i5lgIkTXDu88zqNsWlaQyEZi-BGlNp81Y_MhcgiyWtRkQ72mBZQ9HFG38k-Lahlgv1GvMYvlM6rTMJX3X8rLmvM7-yFSGO4NZLWkFCzBARxc"
                ),
                "cta_label": "Apply Now",
                "deadline": date(2026, 11, 1),
                "is_ongoing": False,
            },
            {
                "title": "Community Mentor",
                "category": "volunteering",
                "description": (
                    "Help local high school students navigate their college applications "
                    "and career choices. 4 hours per week."
                ),
                "image_url": (
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuD_ldnFuHu72VfpwTOKSBXuwuHcFpsA2iqlIt4x0uMPZxZbMRiK6sE6gpQdKZwFJwBOw56HV-SfcSJoruzoKJOqJA_eKhts6OX5PNh-vL5-ou8W9hsazCVTYrOkRDnY-ogJ7-w0EOuXHAMjtYJLuB2u2XpA3akPykRCNUBtLwmsrCs4HAB-mGCbsFKZ6ZjTfrVLs8ZntW_0C2K0zLtYrjDs0K3T8gV6-5ipbNiV6HYovFP5I4brFQx5SaikdHcIy4qcRisjYKrFwxY"
                ),
                "cta_label": "Join Us",
                "deadline": None,
                "is_ongoing": True,
            },
            {
                "title": "Global AI Hackathon",
                "category": "competition",
                "description": (
                    "Compete with engineers worldwide to solve sustainability challenges "
                    "using Large Language Models. $10k Prize."
                ),
                "image_url": (
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuDexTLGeq8Qbnkihz5JZU3zwuCgq6wo1q8QOtCDbrZuG-aimNEylbebRVIByGK-4vjbWhbFfgi_sXBat6rjvuIuVd_f66Tr_UcsjF_PUWV3Kbeh1IU0SbdHRohr2YNaQJMm1ciC4XMwhLx-HgC_ncTJIh0K6KbUi1wVPc62JWjz68l3vfj4t1xXCQfeWYEZgE0dK6wiLa1Rn0IXt77e2l5Mgy7qAY5rscmqufA2HK0Jeb1OAxky0BOE0XfnOOZjhOXHFnA9KLeo7QY"
                ),
                "cta_label": "Register",
                "deadline": date(2026, 9, 30),
                "is_ongoing": False,
            },
            {
                "title": "Data Analyst Trainee",
                "category": "internship",
                "description": (
                    "Learn to interpret complex data sets and translate them into actionable "
                    "business insights for a leading retail brand."
                ),
                "image_url": (
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuCHiumZ8DSnhmGmsX_NtyMOS6e5AMZd5reQIFZhC-FgG7VlfNIwYeswi78pPmv4I7uhrZAcVQYHQ-Ry1hj8_F9Jn6yk17cqIg0-TJPX5bYsR2-C-K7-O4sliQ_4LbEiiulFBgHNBU2NcFqZvwx3L-YytC7W_8C3mEv-RF6WDjwSGQqMKetgiVYtHlVM2fPhqq09GIX3TPThMqI_rdTukbx5NFztMKTg3jOPqEIX0i2-FouXNfL47FTk8m1y91_GUOEchdrSPoIAB1k"
                ),
                "cta_label": "Apply Now",
                "deadline": date(2026, 10, 20),
                "is_ongoing": False,
            },
            {
                "title": "Social Impact Pitch",
                "category": "competition",
                "description": (
                    "Present your startup idea that addresses a UN Sustainable Development "
                    "Goal to a panel of venture capitalists."
                ),
                "image_url": (
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuBWmXI4ghItC12pxqWkSPo0i3pBsCpSZ-UN_iv3JYQx8PAv5naU7kT3iSIK8clpVZr86z1EIFXsoWM5sz1fsRBDmHGY7xovC-aZlQ17W8oenlwN9hXpOZ8xSq1kg_yPZXaKoYRvYWtDeT3rqOguk-N9lcD5R-Zb8Nz2W0V9RV0fqENuyDY06WtTXmdlywe13sOXza4RrxCkrV-tuM6U-_33EGZU_a1miFs6Ki3p5LPUkRFMqFGYSz-fZYl9FHJJzMEplqNCfCBEVpo"
                ),
                "cta_label": "Register",
                "deadline": date(2026, 12, 5),
                "is_ongoing": False,
            },
        ]

        featured_opp_titles = [item["title"] for item in featured_opportunities]
        Opportunity.objects.exclude(title__in=featured_opp_titles).delete()
        for item in featured_opportunities:
            Opportunity.objects.update_or_create(title=item["title"], defaults=item)

        demo_mentors = [
            ("alex.morgan", "Alex", "Morgan", "alex.morgan@newruz.demo"),
            ("priya.shah", "Priya", "Shah", "priya.shah@newruz.demo"),
            ("jordan.lee", "Jordan", "Lee", "jordan.lee@newruz.demo"),
        ]
        for username, first, last, email in demo_mentors:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": email,
                    "first_name": first,
                    "last_name": last,
                    "role": User.Role.MENTOR,
                },
            )
            if created:
                user.set_password("demo12345")
                user.save()
            elif user.role != User.Role.MENTOR:
                user.role = User.Role.MENTOR
                user.save(update_fields=["role"])

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {Program.objects.count()} programs, "
                f"{Event.objects.count()} events, "
                f"{Opportunity.objects.count()} opportunities."
            )
        )
