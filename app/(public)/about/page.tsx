import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Target, Award, Globe, Heart, Shield } from "lucide-react";

export default function AboutPage() {
  const teamMembers = [
    {
      name: "Dr. Sarah Johnson",
      role: "Chief Medical Officer",
      bio: "Board-certified pharmacist with 15+ years of experience in healthcare technology.",
      image: "👩‍⚕️"
    },
    {
      name: "Michael Chen",
      role: "Lead Developer",
      bio: "Full-stack developer specializing in healthcare applications and data security.",
      image: "👨‍💻"
    },
    {
      name: "Emily Rodriguez",
      role: "UX Designer",
      bio: "Design expert focused on creating intuitive healthcare management interfaces.",
      image: "👩‍🎨"
    },
    {
      name: "Dr. James Wilson",
      role: "Pharmacy Consultant",
      bio: "Retired pharmacy director with expertise in regulatory compliance and operations.",
      image: "👨‍⚕️"
    }
  ];

  const milestones = [
    { year: "2020", event: "Company Founded", description: "Started with a vision to revolutionize pharmacy management" },
    { year: "2021", event: "First Product Launch", description: "Launched our core inventory management system" },
    { year: "2022", event: "100+ Customers", description: "Reached our first major customer milestone" },
    { year: "2023", event: "Advanced Analytics", description: "Introduced comprehensive reporting and analytics features" },
    { year: "2024", event: "Cloud Migration", description: "Completed migration to cloud-based infrastructure" }
  ];

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            About ClinicStock
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're dedicated to transforming healthcare through innovative pharmacy management solutions 
            that prioritize patient safety, operational efficiency, and regulatory compliance.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <Card className="border-2 border-blue-100">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">Our Mission</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-lg leading-relaxed">
                To empower healthcare professionals with cutting-edge technology that streamlines 
                pharmacy operations, ensures medication safety, and improves patient outcomes. 
                We believe that efficient pharmacy management is the foundation of quality healthcare.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-100">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <Globe className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-2xl">Our Vision</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-lg leading-relaxed">
                To become the global standard for pharmacy management systems, enabling healthcare 
                providers worldwide to deliver safer, more efficient, and more personalized care 
                through intelligent technology solutions.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Patient-Centric</h3>
              <p className="text-gray-600">Every decision we make prioritizes patient safety and care quality.</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Security First</h3>
              <p className="text-gray-600">Protecting sensitive healthcare data with enterprise-grade security.</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Excellence</h3>
              <p className="text-gray-600">Committed to delivering the highest quality products and services.</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Collaboration</h3>
              <p className="text-gray-600">Working closely with healthcare professionals to solve real problems.</p>
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Meet Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="text-6xl mb-4">{member.image}</div>
                  <CardTitle className="text-xl">{member.name}</CardTitle>
                  <Badge variant="secondary">{member.role}</Badge>
                </CardHeader>
                <CardContent>
                  <CardDescription>{member.bio}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Journey</h2>
          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-blue-200"></div>
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className="flex-1 px-8">
                    <Card className={`${index % 2 === 0 ? 'ml-auto' : 'mr-auto'} max-w-md`}>
                      <CardHeader>
                        <div className="flex items-center space-x-2">
                          <Badge variant="default">{milestone.year}</Badge>
                          <CardTitle className="text-lg">{milestone.event}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription>{milestone.description}</CardDescription>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-lg"></div>
                  <div className="flex-1"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-8">Our Impact</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-blue-100">Pharmacies Served</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">1M+</div>
              <div className="text-blue-100">Prescriptions Managed</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-blue-100">Uptime Guarantee</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Customer Support</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
