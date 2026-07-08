/// Mirrors the backend's `User` model (see `backend/src/models/User.js`),
/// trimmed to the fields the mobile app actually needs.
class UserModel {
  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.phone,
    this.pharmacy,
    this.addresses = const [],
  });

  final String id;
  final String name;
  final String email;
  final String? phone;
  final String role;
  final String? pharmacy;
  final List<UserAddress> addresses;

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['_id'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
      phone: json['phone'] as String?,
      role: json['role'] as String? ?? 'customer',
      pharmacy: json['pharmacy'] as String?,
      addresses: (json['addresses'] as List<dynamic>? ?? [])
          .map((a) => UserAddress.fromJson(a as Map<String, dynamic>))
          .toList(),
    );
  }

  UserModel copyWith({String? name, String? phone}) {
    return UserModel(
      id: id,
      name: name ?? this.name,
      email: email,
      phone: phone ?? this.phone,
      role: role,
      pharmacy: pharmacy,
      addresses: addresses,
    );
  }
}

class UserAddress {
  const UserAddress({
    required this.id,
    required this.label,
    required this.street,
    required this.city,
    this.isDefault = false,
  });

  final String id;
  final String label;
  final String street;
  final String city;
  final bool isDefault;

  factory UserAddress.fromJson(Map<String, dynamic> json) {
    return UserAddress(
      id: json['_id'] as String,
      label: json['label'] as String? ?? 'Home',
      street: json['street'] as String,
      city: json['city'] as String,
      isDefault: json['isDefault'] as bool? ?? false,
    );
  }
}
