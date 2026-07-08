import 'package:flutter/material.dart';

class OnboardingSlide {
  const OnboardingSlide({required this.icon, required this.title, required this.description});

  final IconData icon;
  final String title;
  final String description;
}

const onboardingSlides = [
  OnboardingSlide(
    icon: Icons.electric_moped_outlined,
    title: 'Fast Healthcare Delivery',
    description:
        'Get your medicines delivered to your doorstep within minutes. Reliable, safe, and '
        'professional care at your command.',
  ),
  OnboardingSlide(
    icon: Icons.verified_outlined,
    title: 'Verified Pharmacies',
    description:
        'Every partner pharmacy is licensed and verified, so you always receive authentic, '
        'quality-checked medication.',
  ),
  OnboardingSlide(
    icon: Icons.location_on_outlined,
    title: 'Live Order Tracking',
    description:
        'Track your delivery in real time from checkout to your doorstep, every step of '
        'the way.',
  ),
];
