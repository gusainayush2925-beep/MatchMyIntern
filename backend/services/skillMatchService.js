const calculateMatchScore = (studentSkills, requiredSkills) => {
  if (!studentSkills || !requiredSkills || requiredSkills.length === 0) return 0;
  const student = studentSkills.map(s => s.toLowerCase().trim());
  const required = requiredSkills.map(s => s.toLowerCase().trim());
  const matched = required.filter(s => student.includes(s));
  return Math.round((matched.length / required.length) * 100);
};

module.exports = { calculateMatchScore };