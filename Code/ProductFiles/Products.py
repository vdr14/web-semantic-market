"""
This script reads product data from a CSV file named 'Products.csv', which should be located in the same folder as this script.
It generates an RDF graph in Turtle format and saves it to a file named 'Products.ttl'.
The script:
1. Defines classes, subclasses, and properties based on the CSV file's structure.
2. Adds specific properties for products and users, including stock levels, order and user details.
3. Includes an AdminUser instance with predefined attributes.
4. Ensures compatibility with reasoners and annotations like rdfs:seeAlso.

Then it generates an other Turtle file containg Shacl shapes and saves it to a file named 'Shacl_shapes.ttl'.
"""

import pandas as pd
import os
import random
from rdflib import Graph, Namespace, RDF, RDFS

# Define file paths
csv_file = "Products.csv"  # CSV file must be in the same folder as this script
output_file = "Products.ttl"  # Output Turtle file

# Check if the file exists
if not os.path.exists(csv_file):
    raise FileNotFoundError(f"File {csv_file} not found.")

# Load the CSV file
data = pd.read_csv(csv_file)

# Create RDF graph
g = Graph()

# Define namespaces
PTO = Namespace("http://www.productontology.org/id/")
BASE = Namespace("http://www.semanticweb.org/My_Super/")
GR = Namespace("http://purl.org/goodrelations/v1#")
OWL = Namespace("http://www.w3.org/2002/07/owl#")
RDF_NS = Namespace("http://www.w3.org/1999/02/rdf-syntax-ns#")
XML = Namespace("http://www.XML/1998/namespace")
XSD = Namespace("http://www.w3.org/2001/XMLSchema#")
RDFS_NS = Namespace("http://www.w3.org/2000/01/rdf-schema#")

# Bind namespaces
g.bind("pto", PTO)
g.bind("", BASE)
g.bind("gr", GR)
g.bind("owl", OWL)
g.bind("rdf", RDF_NS)
g.bind("xml", XML)
g.bind("xsd", XSD)
g.bind("rdfs", RDFS_NS)

# Turtle statements
turtle_statements = [
    "@prefix : <http://www.semanticweb.org/My_Super/> .",
    "@prefix gr: <http://purl.org/goodrelations/v1#> .",
    "@prefix owl: <http://www.w3.org/2002/07/owl#> .",
    "@prefix pto: <http://www.productontology.org/id/> .",
    "@prefix rdf: <http://www.w3.org/1999/02/rdf-syntax-ns#> .",
    "@prefix xml: <http://www.XML/1998/namespace> .",
    "@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .",
    "@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .",
    "@base <http://www.semanticweb.org/My_Super/> .",
    "",
]

# Add ontology
turtle_statements.append("<http://www.semanticweb.org/My_Super> a owl:Ontology .\n")

# Add properties headline
turtle_statements.append("#################################################################")
turtle_statements.append("#    Data properties")
turtle_statements.append("#################################################################\n")

# Define properties
properties = [
    """
###  http://purl.org/goodrelations/v1#name
gr:name a owl:DatatypeProperty ;
        rdfs:domain gr:ProductOrService ;
        rdfs:range rdfs:Literal .
""",
    """
###  http://www.semanticweb.org/My_Super#hasBrand
:hasBrand a owl:DatatypeProperty ;
          rdfs:domain gr:ProductOrService ;
          rdfs:range rdfs:Literal ;
          rdfs:comment "This property is inspired by gr:hasBrand from the GoodRelations ontology. However, its range has been changed from gr:Brand to rdfs:Literal to simplify the representation of brands as literal values rather than requiring the creation of separate instances of gr:Brand. This approach was chosen for ease of use and to align with the structure of the current dataset, which lists brands as plain text rather than as linked data entities." ;
          rdfs:seeAlso "http://purl.org/goodrelations/v1#hasBrand" .
""",
    """
###  http://www.semanticweb.org/My_Super#hasDiscountPrice
:hasDiscountPrice a owl:DatatypeProperty ;
                  rdfs:domain gr:ProductOrService ;
                  rdfs:range xsd:double .
""",
    """
###  http://www.semanticweb.org/My_Super#hasPrice
:hasPrice a owl:DatatypeProperty ;
          rdfs:domain gr:ProductOrService ;
          rdfs:range xsd:double ;
          rdfs:comment "The price is in euro." .
""",
    """
###  http://www.semanticweb.org/My_Super#hasProductID
:hasProductID a owl:DatatypeProperty ;
              rdfs:domain gr:ProductOrService ;
              rdfs:range rdfs:Literal ;
              rdfs:comment "A unique identifier for a product, specific to this ontology. This property is used when existing identifiers such as EAN or GTIN are not applicable." .
""",
    """
###  http://www.semanticweb.org/My_Super#hasQuantity
:hasQuantity a owl:DatatypeProperty ;
             rdfs:domain gr:ProductOrService ;
             rdfs:range rdfs:Literal ;
             rdfs:comment "The quantity of the product." .
""",
    """
###  http://www.semanticweb.org/My_Super#isAvailable
:isAvailable a owl:DatatypeProperty ;
             rdfs:domain gr:ProductOrService ;
             rdfs:range xsd:boolean .
""",
    """
###  http://www.semanticweb.org/My_Super#hasStock
:hasStock a owl:DatatypeProperty ;
          rdfs:domain gr:ProductOrService ;
          rdfs:range xsd:integer ;
          rdfs:comment "The stock quantity of the product in the store." .
""",
    """
###  http://www.semanticweb.org/My_Super#hasUsername
:hasUsername a owl:DatatypeProperty ;
             rdfs:domain :User ;
             rdfs:range rdfs:Literal ;
             rdfs:comment "The username of a user." .
""",
    """
###  http://www.semanticweb.org/My_Super#hasPassword
:hasPassword a owl:DatatypeProperty ;
             rdfs:domain :User ;
             rdfs:range rdfs:Literal ;
             rdfs:comment "The password of a user." .
""",
    """
###  http://www.semanticweb.org/My_Super#hasName
:hasName a owl:DatatypeProperty ;
         rdfs:domain :User ;
         rdfs:range rdfs:Literal ;
         rdfs:comment "The first name of a user." .
""",
    """
###  http://www.semanticweb.org/My_Super#hasSurname
:hasSurname a owl:DatatypeProperty ;
            rdfs:domain :User ;
            rdfs:range rdfs:Literal ;
            rdfs:comment "The surname of a user." .
""",
    """
###  http://www.semanticweb.org/My_Super#hasAddress
:hasAddress a owl:DatatypeProperty ;
            rdfs:domain :User ;
            rdfs:range rdfs:Literal ;
            rdfs:comment "The address of a user." .
""",
    """
###  http://www.semanticweb.org/My_Super#hasOrderID
:hasOrderID a owl:DatatypeProperty ;
            rdfs:domain :Order ;
            rdfs:range rdfs:Literal ;
            rdfs:comment "Unique id of the order." .
""",
    """
###  http://www.semanticweb.org/My_Super#hasOrderDate
:hasOrderDate a owl:DatatypeProperty ;
            rdfs:domain :Order ;
            rdfs:range xsd:dateTime ;
            rdfs:comment "The date of the order." .
""",
    """
###  http://www.semanticweb.org/My_Super#hasTotalPrice
:hasTotalPrice a owl:DatatypeProperty ;
            rdfs:domain :Order ;
            rdfs:range xsd:double ;
            rdfs:comment "The total price of the order." .
""",
    """
###  http://www.semanticweb.org/My_Super#isFinalized
:isFinalized a owl:DatatypeProperty ;
            rdfs:domain :Order ;
            rdfs:range xsd:boolean ;
            rdfs:comment "If an order is finalized or not" .
""",
    """
###  http://www.semanticweb.org/My_Super#hasNormalUser
:hasNormalUser a owl:ObjectProperty ;
            rdfs:domain :Order ;
            rdfs:range :NormalUser ;
            rdfs:comment "Connects the order with the NormalUser that made it." .
""",
    """
###  http://www.semanticweb.org/My_Super#hasOrderItem
:hasOrderItem a owl:ObjectProperty ;
            rdfs:domain :Order ;
            rdfs:range :OrderItem ;
            rdfs:comment "Connects the order with the items." .
""",    
    """
###  http://www.semanticweb.org/My_Super#hasProduct
:hasProduct a owl:ObjectProperty ;
            rdfs:domain :OrderItem ;
            rdfs:range gr:ProductOrService ;
            rdfs:comment "Connects the OrderItem with the product it represents." .
""",
    """
###  http://www.semanticweb.org/My_Super#hasOrderQuantity
:hasOrderQuantity a owl:DatatypeProperty ;
            rdfs:domain :OrderItem ;
            rdfs:range xsd:integer ;
            rdfs:comment "The quantity of the product in the order." .
""",
    """
###  http://www.semanticweb.org/My_Super#hasOrderPrice
:hasOrderPrice a owl:DatatypeProperty ;
            rdfs:domain :OrderItem ;
            rdfs:range xsd:double ;
            rdfs:comment "The price the product had at the time of the order." .
""",
    """
###  http://www.semanticweb.org/My_Super#hasOrderItemID
:hasOrderItemID a owl:DatatypeProperty ;
            rdfs:domain :OrderItem ;
            rdfs:range rdfs:Literal ;
            rdfs:comment "Unique id of the orderItem." .
"""
]

# Add properties
turtle_statements.extend(properties)

# Add classes headline
turtle_statements.append("#################################################################")
turtle_statements.append("#    Classes")
turtle_statements.append("#################################################################\n")

# Add class gr:ProductOrService
turtle_statements.append("###  http://purl.org/goodrelations/v1#ProductOrService")
turtle_statements.append("gr:ProductOrService a owl:Class .\n")

# Add class Order
turtle_statements.append("""
###  http://www.semanticweb.org/My_Super#Order
:Order a owl:Class ;
        rdfs:comment "Represents an order in the e-shop.".
""")

# Add class OrderItem
turtle_statements.append("""
###  http://www.semanticweb.org/My_Super#OrderItem
:OrderItem a owl:Class ;
        rdfs:comment "Represents an item in an order in the e-shop.".
""")


# Add class User
turtle_statements.append("""
###  http://www.semanticweb.org/My_Super#User
:User a owl:Class ;
      rdfs:comment "Represents a user of the e-shop." .
""")

# Add subclasses of User
turtle_statements.append("""
###  http://www.semanticweb.org/My_Super#NormalUser
:NormalUser a owl:Class ;
            rdfs:subClassOf :User ;
            rdfs:comment "Represents a normal user of the e-shop." .
""")

turtle_statements.append("""
###  http://www.semanticweb.org/My_Super#AdminUser
:AdminUser a owl:Class ;
           rdfs:subClassOf :User ;
           rdfs:comment "Represents an admin user of the e-shop." .
""")

# Extract unique values from category column
unique_categories = data['category'].drop_duplicates()

# Create classes from category column
for category in unique_categories:
    class_name = category.replace(" ", "_")
    class_uri = f":{class_name}"
    
    # Add comment for each category class
    turtle_statements.append(f"###  http://www.semanticweb.org/My_Super#{class_name}")
    
    # Add class and subclass relation
    turtle_statements.append(f"{class_uri} a owl:Class ;")
    turtle_statements.append(f"               rdfs:subClassOf gr:ProductOrService .\n")

# Extract unique values from category and subcategory columns
subcategory_to_category = data[['subcategory', 'category']].drop_duplicates()

# Create classes from subcategory column
for _, row in subcategory_to_category.iterrows():
    subcategory_name = row['subcategory'].replace(" ", "_")
    category_name = row['category'].replace(" ", "_")
    
    subcategory_uri = f":{subcategory_name}"
    category_uri = f":{category_name}"
    
    # Add comment for each subcategory class
    turtle_statements.append(f"###  http://www.semanticweb.org/My_Super#{subcategory_name}")
    
    # Add class and subclass relation
    turtle_statements.append(f"{subcategory_uri} a owl:Class ;")
    turtle_statements.append(f"                  rdfs:subClassOf {category_uri} .\n")

# Create classes from type and subcategory columns
type_to_subcategory = data[['type', 'subcategory']].drop_duplicates()
for _, row in type_to_subcategory.iterrows():
    class_name = row['type'].replace(" ", "_")
    subclass_of = row['subcategory'].replace(" ", "_")
    
    class_uri = f"pto:{class_name}"
    subclass_uri = f":{subclass_of}"
    
    # Add comment for each type class
    turtle_statements.append(f"###  http://www.productontology.org/id/{class_name}")
    
    # Add class and subclass relation
    turtle_statements.append(f"{class_uri} a owl:Class ;")
    turtle_statements.append(f"             rdfs:subClassOf {subclass_uri} .\n")


# Add instances headline
turtle_statements.append("#################################################################")
turtle_statements.append("#    Instances")
turtle_statements.append("#################################################################\n")

# Create instances from data
for _, row in data.iterrows():
    # Replace empty and special characters
    instance_name = row['name']
    for char in [" ",",",".","%"]:
        instance_name = instance_name.replace(char, "_")
    instance_uri = f":{instance_name}"
    
    
    # Get data from CSV
    product_id = row['id']
    is_available = "true" # Original availabilty
    stock = 10  # Original stock
    belongs_to_class = f"pto:{row['type'].replace(' ', '_')}"  # class from type column
    brand = row['brand']
    price = row['price']
    discount_price = random.choice([0, 5, 10, 15, 20, 25, 30])  # Επιλογή τυχαίας τιμής από τη λίστα
    quantity = row['quantity']  
    product_name = row['name']  # Original name with special characters

    
    turtle_statements.append(f"###  {instance_uri}")

    # Add instance and its properties
    turtle_statements.append(f"{instance_uri} a {belongs_to_class} ;")
    turtle_statements.append(f"             a owl:NamedIndividual ;")
    turtle_statements.append(f"             :hasProductID \"{product_id}\"^^xsd:string ;")
    turtle_statements.append(f"             :isAvailable \"{is_available}\"^^xsd:boolean ;")
    turtle_statements.append(f"             :hasStock \"{stock}\"^^xsd:integer ;")
    turtle_statements.append(f"             :hasBrand \"{brand}\"^^xsd:string ;")
    turtle_statements.append(f"             :hasPrice \"{price}\"^^xsd:double ;")
    turtle_statements.append(f"             :hasDiscountPrice \"{discount_price}\"^^xsd:double ;")
    turtle_statements.append(f"             :hasQuantity \"{quantity}\"^^xsd:string ;")
    turtle_statements.append(f"             gr:name \"{product_name}\"^^xsd:string .\n")

# Add User instances
turtle_statements.append("#################################################################")
turtle_statements.append("#    User Instances")
turtle_statements.append("#################################################################\n")

admin_instance_uri = ":Admin1"  # URI for AdminUser

turtle_statements.append(f"###  {admin_instance_uri}")
turtle_statements.append(f"{admin_instance_uri} a :AdminUser ;")
turtle_statements.append(f"             :hasName \"Vasilis\"^^xsd:string ;")
turtle_statements.append(f"             :hasSurname \"Voudrislis\"^^xsd:string ;")
turtle_statements.append(f"             :hasUsername \"admin\"^^xsd:string ;")
turtle_statements.append(f"             :hasPassword \"password\"^^xsd:string .\n")

normal_instance_uri = ":User1"  # URI for NormalUser

turtle_statements.append(f"###  {normal_instance_uri}")
turtle_statements.append(f"{normal_instance_uri} a :NormalUser ;")
turtle_statements.append(f"             :hasName \"Vasilis\"^^xsd:string ;")
turtle_statements.append(f"             :hasSurname \"Voudrislis\"^^xsd:string ;")
turtle_statements.append(f"             :hasUsername \"user\"^^xsd:string ;")
turtle_statements.append(f"             :hasPassword \"password\"^^xsd:string ;")
turtle_statements.append(f"             :hasAddress \"123 Main Street, Cityville\"^^xsd:string .\n")


# Add rdfs:seeAlso Headline
turtle_statements.append("#################################################################")
turtle_statements.append("#    See Also References for Classes")
turtle_statements.append("#################################################################\n")

#Add some rdfs:seeAlso annotations because pto is deprecated
class_seealso = {
    "Orange": "http://www.productontology.org/id/Orange_(fruit)",
    "Lime": "http://www.productontology.org/id/Lime_(fruit)",
    "Kiwi": "http://www.productontology.org/id/Kiwifruit",
    "Spreads": "http://www.productontology.org/id/Spread_(food)",
    "Cracker": "http://www.productontology.org/id/Cracker_(food)",
    "Sponge": "http://www.productontology.org/id/Sponge_(tool)",
    "Duster": "http://www.productontology.org/id/Housekeeping"
}

for class_name, seealso_value in class_seealso.items():
    class_uri = f"pto:{class_name.replace(' ', '_')}"  
    if "http" in seealso_value:
        turtle_statements.append(f"{class_uri} rdfs:seeAlso <{seealso_value}> .\n")
    else:
        turtle_statements.append(f"{class_uri} rdfs:seeAlso \"{seealso_value}\"^^xsd:string .\n")



# Save turtle file
with open(output_file, "w", encoding="utf-8") as f:
    f.write("\n".join(turtle_statements))

print(f"Products Turtle file saved as {output_file}")

ttl_content = """\
#################################################################
#    SHACL Shapes
#################################################################

@prefix : <http://www.semanticweb.org/My_Super/> .
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix gr: <http://purl.org/goodrelations/v1#> .

###  SHACL Shapes for Product Input
:ProductShape a sh:NodeShape ;
    sh:targetClass gr:ProductOrService ;

    # ProductID (must exist)
    sh:property [
        sh:path :hasProductID ;
        sh:datatype xsd:string ;
        sh:minCount 1 ;
        sh:message "Product id is required." ;
    ] ;

    # Price (must exist, must be >0)
    sh:property [
        sh:path :hasPrice ;
        sh:datatype xsd:double ;
        sh:minCount 1 ;
        sh:minExclusive 0 ;
        sh:message "Price must be greater than 0." ;
    ] ;

    # DiscountPrice (must exist, must be >=0)
    sh:property [
        sh:path :hasDiscountPrice ;
        sh:datatype xsd:double ;
        sh:minCount 1 ;
        sh:minInclusive 0 ;
        sh:message "Discount price must be 0 or greater." ;
    ] ;

    # Product Name (must exist)
    sh:property [
        sh:path gr:name ;
        sh:datatype xsd:string ;
        sh:minCount 1 ;
        sh:message "Product name is required." ;
    ] ;

    # Brand (must exist)
    sh:property [
        sh:path :hasBrand ;
        sh:datatype xsd:string ;
        sh:minCount 1 ;
        sh:message "Brand is required." ;
    ] ;

    # Quantity (must exist)
    sh:property [
        sh:path :hasQuantity ;
        sh:datatype xsd:string ;
        sh:minCount 1 ;
        sh:message "Quantity must be specified." ;
    ] ;

    # Availability (must exist, boolean)
    sh:property [
        sh:path :isAvailable ;
        sh:datatype xsd:boolean ;
        sh:minCount 1 ;
        sh:message "Availability status is required." ;
    ] ;

    # Stock (must exist, must be >= 0)
    sh:property [
        sh:path :hasStock ;
        sh:datatype xsd:integer ;
        sh:minCount 1 ;
        sh:minInclusive 0 ;
        sh:message "Stock quantity must be 0 or greater." ;
    ] .

:UniqueProductIDShape
    a sh:NodeShape ;
    sh:targetObjectsOf :hasProductID ;
    sh:property [
        sh:path [ sh:inversePath :hasProductID ] ;
        sh:maxCount 1 ;
        sh:message "Each product must have a unique ProductID." ;
    ] .

###  SHACL Shapes for NormalUser
:NormalUserShape a sh:NodeShape ;
    sh:targetClass :NormalUser ;

    # Name (must exist)
    sh:property [
        sh:path :hasName ;
        sh:datatype xsd:string ;
        sh:minCount 1 ;
        sh:message "User must have a first name." ;
    ] ;

    # Surname (must exist)
    sh:property [
        sh:path :hasSurname ;
        sh:datatype xsd:string ;
        sh:minCount 1 ;
        sh:message "User must have a surname." ;
    ] ;

     # Username (must exist)
    sh:property [
        sh:path :hasUsername ;
        sh:datatype xsd:string ;
        sh:minCount 1 ;
        sh:message "Each user must have a username." ;
    ] ;

    # Password (must exist)
    sh:property [
        sh:path :hasPassword ;
        sh:datatype xsd:string ;
        sh:minCount 1 ;
        sh:message "Each user must have a password" ;
    ] ;

    # Address (must exist)
    sh:property [
        sh:path :hasAddress ;
        sh:datatype xsd:string ;
        sh:minCount 1 ;
        sh:message "User must have at least one address." ;
    ] .

:UniqueUsernameShape
    a sh:NodeShape ;
    sh:targetObjectsOf :hasUsername ; 
    sh:property [
        sh:path [ sh:inversePath :hasUsername ] ;
        sh:maxCount 1 ;
        sh:message "Each username must be unique." ;
    ] .
"""

# Save the content to a Turtle file
ttl_filename = "Shacl_shapes.ttl"
with open(ttl_filename, "w", encoding="utf-8") as file:
    file.write(ttl_content)

print(f"SHACL shapes successfully written to {ttl_filename}")


