"use client";

import { useEffect, useState } from "react";
import { medicineApi, Medicine } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pill, Syringe, Heart, Shield, Brain, Eye, Search, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

export default function ProductsPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadMedicines();
  }, []);

  const loadMedicines = async () => {
    try {
      const response = await medicineApi.getAll({ page: 1, limit: 1000, isActive: true });
      // Filter medicines that are in stock (quantity > 0)
      const inStockMedicines = response.medicines.filter(medicine => medicine.quantity > 0);
      setMedicines(inStockMedicines);
    } catch (error) {
      console.error("Failed to load medicines:", error);
      toast.error("Failed to load medicines");
    } finally {
      setLoading(false);
    }
  };

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medicine.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB'
    }).format(price);
  };

  const getStockStatus = (quantity: number) => {
    if (quantity <= 0) return { label: "Out of Stock", variant: "destructive" as const };
    if (quantity <= 10) return { label: "Low Stock", variant: "secondary" as const };
    return { label: "In Stock", variant: "default" as const };
  };

  const handleAddToCart = (medicine: Medicine) => {
    toast.success(`${medicine.name} added to cart!`);
    // TODO: Implement actual cart functionality
  };

  const productCategories = [
    {
      icon: <Pill className="h-8 w-8" />,
      title: "Prescription Medicines",
      description: "Comprehensive inventory of prescription medications with proper tracking and expiry management.",
      features: ["Expiry tracking", "Batch management", "Prescription validation", "Stock alerts"]
    },
    {
      icon: <Syringe className="h-8 w-8" />,
      title: "Medical Supplies",
      description: "Essential medical supplies and equipment for healthcare facilities.",
      features: ["Equipment tracking", "Maintenance schedules", "Usage monitoring", "Cost analysis"]
    },
    {
      icon: <Heart className="h-8 w-8" />,
      title: "Cardiovascular Care",
      description: "Specialized medications and supplies for cardiovascular health management.",
      features: ["Blood pressure monitoring", "Heart medication tracking", "Patient records", "Dosage management"]
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Immunization",
      description: "Vaccines and immunization supplies with cold chain management.",
      features: ["Temperature monitoring", "Vaccine scheduling", "Patient immunization history", "Compliance tracking"]
    },
    {
      icon: <Brain className="h-8 w-8" />,
      title: "Mental Health",
      description: "Medications and resources for mental health and neurological conditions.",
      features: ["Mood tracking", "Medication adherence", "Side effect monitoring", "Therapy coordination"]
    },
    {
      icon: <Eye className="h-8 w-8" />,
      title: "Ophthalmology",
      description: "Eye care medications, drops, and vision-related supplies.",
      features: ["Vision tracking", "Eye drop scheduling", "Optical supplies", "Appointment management"]
    }
  ];

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Our Products & Services
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Browse our comprehensive selection of medicines and healthcare products. 
            All items are in stock and ready for purchase.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search medicines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Medicines Grid */}
        <div className="mb-16">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading medicines...</p>
            </div>
          ) : filteredMedicines.length > 0 ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Available Medicines ({filteredMedicines.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredMedicines.map((medicine) => {
                  const stockStatus = getStockStatus(medicine.quantity);
                  return (
                    <Card key={medicine.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant={stockStatus.variant} className="text-xs">
                            {stockStatus.label}
                          </Badge>
                          {medicine.category && (
                            <Badge variant="outline" className="text-xs">
                              {medicine.category.name}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg line-clamp-2">{medicine.name}</CardTitle>
                        <CardDescription className="text-sm">
                          Quantity: {medicine.quantity} units
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-2xl font-bold text-blue-600">
                              {formatPrice(medicine.sellingPrice)}
                            </span>
                          </div>
                          <Button 
                            className="w-full" 
                            onClick={() => handleAddToCart(medicine)}
                            disabled={medicine.quantity <= 0}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            {medicine.quantity <= 0 ? "Out of Stock" : "Add to Cart"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Pill className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No medicines found</h3>
              <p className="text-gray-600">
                {searchTerm ? "Try adjusting your search terms" : "No medicines are currently in stock"}
              </p>
            </div>
          )}
        </div>

        {/* Product Categories */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Our Service Categories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {productCategories.map((category, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      {category.icon}
                    </div>
                    <CardTitle className="text-xl">{category.title}</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    {category.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {category.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span className="text-sm text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Key Features Section */}
        <div className="bg-blue-50 rounded-2xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Key Platform Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="font-bold">1</span>
              </div>
              <h3 className="font-semibold mb-2">Inventory Management</h3>
              <p className="text-sm text-gray-600">Track stock levels, expiry dates, and batch numbers</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="font-bold">2</span>
              </div>
              <h3 className="font-semibold mb-2">Sales Tracking</h3>
              <p className="text-sm text-gray-600">Monitor sales, revenue, and profit margins</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="font-bold">3</span>
              </div>
              <h3 className="font-semibold mb-2">Customer Management</h3>
              <p className="text-sm text-gray-600">Maintain customer records and purchase history</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="font-bold">4</span>
              </div>
              <h3 className="font-semibold mb-2">Reporting & Analytics</h3>
              <p className="text-sm text-gray-600">Generate detailed reports and insights</p>
            </div>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Built with Modern Technology
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {["React", "Next.js", "TypeScript", "PostgreSQL", "NestJS", "Tailwind CSS"].map((tech) => (
              <Badge key={tech} variant="secondary" className="px-4 py-2 text-sm">
                {tech}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
